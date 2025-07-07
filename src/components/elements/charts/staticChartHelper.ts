/// <reference types="chart.js" />
import {ParsedMeasurement, ParsedMetadata} from '@/client';
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
    startIndex: number = 0,
    endIndex: number|undefined = undefined,
    maxPointsPerSet: number = 2000,
    chartColors: string[] = ['red', 'green', 'blue', 'yellow', 'purple']
): Chart.ChartDataSets[] {
    const length = endIndex ? endIndex - startIndex : data.timestamp.length
    const interval = length >= maxPointsPerSet
        ? Math.floor(length / maxPointsPerSet)
        : 1

    return data.datasets.map((dataset, index) => {
        const subset: Chart.ChartPoint[] = []
        for (let i = startIndex; i <= startIndex + length; i += interval) {
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
    progress: Ref<number>,
    parsedMetadata: Ref<ParsedMetadata|undefined>
): void {
    if (!line.trim()) return;

    const parsedLine = JSON.parse(line);

    if (parsedLine.progress !== undefined) {
        progress.value = Math.floor(parsedLine.progress * 100)
        return
    }
    if (parsedLine.name !== undefined) {
        const chunk: ParsedMeasurement = parsedLine;

        result.counter.push(...chunk.counter);
        result.timestamp.push(...(chunk.timestamp.map((ts: number) => ts / 1000000)));

        chunk.datasets.forEach((dataset: any) => {
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
        return
    }

    const meta = JSON.parse(line)
    parsedMetadata.value = meta as ParsedMetadata
}

export function findNextClosestSmaller(sortedArr: number[], num: number): number {
    let left = 0, right = sortedArr.length - 1;
    let closestIndex = -1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (sortedArr[mid] < num) {
            closestIndex = mid;
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return closestIndex;
}