/// <reference types="chart.js" />
import {ParsedMeasurement} from '@/client';
import {Ref} from 'vue';

export type ChartBoundaries = {
    xmin: number,
    xmax: number,
    ymin: number,
    ymax: number
}

export type DisplayableMeasurement = {
    name: string,
    counter: number[],
    timestamp: number[],
    datasets: Array<{
        name: string,
        data: Array<Chart.ChartPoint>
    }>
}

export function getSubsetOfMeasurement(
    data: DisplayableMeasurement,
    maxPointsPerSet: number = 2000,
    chartColors: string[] = ['red', 'green', 'blue', 'yellow', 'purple']
): Chart.ChartDataSets[] {
    const length = data.timestamp.length
    const interval = length >= maxPointsPerSet
        ? Math.floor(length / maxPointsPerSet)
        : 1

    return data.datasets.map((dataset, index) => {
        const subset: Chart.ChartPoint[] = []
        for (let i = 0; i <= length; i += interval) {
            subset.push(dataset.data[i])
        }
        // if the interval jump has exceeded the array, pop the last item
        if(!subset.at(-1)) {
            subset.pop()
        }
        return {
            data: subset,
            label: dataset.name,
            pointRadius: 1,
            borderColor: chartColors[index],
        }
    })
}

// eslint-disable-next-line max-len
export function computeChartBoundaries(data: Chart.ChartPoint[][]): ChartBoundaries {
    const start = data[0][0].x
    const end = data[0][data[0].length - 1].x

    const flattenedYValues: number[] = data
        .flat()
        .map(entry => entry.y as number)

    return {
        xmin: start as number,
        xmax: end as number,
        ymin: Math.min(...flattenedYValues),
        ymax: Math.max(...flattenedYValues)
    }
}

export function processLine(
    line: string,
    result: DisplayableMeasurement,
    progress: Ref<number>
): void {
    if (!line.trim()) return;

    const parsedLine = JSON.parse(line);

    if (parsedLine.progress !== undefined) {
        progress.value = Math.floor(parsedLine.progress * 100)
    } else {
        const chunk: ParsedMeasurement = parsedLine;

        result.counter.push(...chunk.counter);
        result.timestamp.push(...chunk.timestamp);

        chunk.datasets.forEach((dataset) => {
            const combined = []
            for (let i = 0; i < chunk.timestamp.length; i++) {
                combined.push({
                    x: chunk.timestamp[i] / 1000000,
                    y: dataset.data[i],
                })
            }
            // eslint-disable-next-line max-len
            const existingDataset = result.datasets.find(d => d.name === dataset.name);
            if (existingDataset) {
                existingDataset.data.push(...combined);
            } else {
                result.datasets.push({
                    name: dataset.name,
                    data: [...combined]
                });
            }
        });
    }
}