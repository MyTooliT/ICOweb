/// <reference types="chart.js" />
import {ParsedMeasurement, ParsedMetadata} from '@/client';
import {Ref} from 'vue';
import {ChartData, ChartDataset} from 'chart.js';
import {getAPILink} from '@/api/icoapi.ts';

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

export function computeChartDataAndBoundaries(
    parsedData: DisplayableMeasurement,
    data: Ref<ChartData<'line'>>,
    boundaries: Ref<ChartBoundaries>,
    startIndex: number = 0,
    endIndex: number|undefined = undefined): void {
    const newDatasets = getSubsetOfMeasurement(parsedData, startIndex, endIndex);
    const dataOnly = newDatasets.map(set => set.data as Chart.ChartPoint[])

    data.value.datasets = newDatasets as ChartDataset<'line', Chart.Point[]>[]
    boundaries.value = { ...computeChartBoundaries(dataOnly) }
}

export async function consumeFileReader(
    reader: ReadableStreamDefaultReader,
    progress: Ref<number>,
    parsedMetadata: Ref<ParsedMetadata | undefined>,
    fileName: string,
): Promise<DisplayableMeasurement> {
    const decoder = new TextDecoder('utf-8');
    let receivedText = '';
    const combinedResult: DisplayableMeasurement = {
        name: fileName,
        counter: [],
        timestamp: [],
        datasets: []
    };

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            receivedText += decoder.decode(value, { stream: true });
            const lines = receivedText.split('\n');

            // Process each line except the last (incomplete line)
            for (const line of lines.slice(0, -1)) {
                processLine(line, combinedResult, progress, parsedMetadata)
            }

            // Keep the last incomplete line for the next iteration
            receivedText = lines[lines.length - 1];
        }
    } catch (error) {
        console.log('This should never be reached - if it was, good luck');
        throw error
    }

    return combinedResult;
}

export async function fetchFileReader(fileName: string): Promise<ReadableStreamDefaultReader> {
    const response = await fetch(`${getAPILink()}/files/analyze/${fileName}`);
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Failed to read response body');
    }
    return reader
}


/**
 * This function is solely to strip the incoming base64 string of its artifacts.
 * The used backend (FastAPI) seems to wrap the encoded string in b'', which we remove here.
 * If the prefix and suffix are not found, the content is simply returned.
 * @param content The encoded, unstripped string.
 * @returns The stripped base64 encoded string or the provided string
 */
export function decode(content: string): string {
    if(content.startsWith('b\'') && content.endsWith('\'')) {
        return content.substring(2,content.length - 1)
    }
    return content
}