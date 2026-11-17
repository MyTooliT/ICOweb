/// <reference types="chart.js" />
import {ParsedMeasurement, ParsedMetadata} from '@/client';
import {Ref} from 'vue';
import {ChartData, ChartDataset} from 'chart.js';
import {getAPILink} from '@/api/icoapi.ts';
import {describeDetail} from '@/api/api.ts';

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
    datasetUnits: Array<string>,
    startIndex: number = 0,
    endIndex: number|undefined = undefined,
    maxPointsPerSet: number = 5000,
    chartColors: string[] = ['black', 'red', 'green', 'blue', 'yellow', 'purple']
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
            yAxisID: datasetUnits[index]
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
    datasetUnits: Array<string>,
    startIndex: number = 0,
    endIndex: number|undefined = undefined): void {
    const newDatasets = getSubsetOfMeasurement(parsedData, datasetUnits, startIndex, endIndex);
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

/**
 * Get the text of an error response of the API (the `detail` of the error).
 */
async function errorText(response: Response): Promise<string> {
    try {
        return describeDetail((await response.json())['detail'])
    } catch {
        return `${response.status} ${response.statusText}`
    }
}

/**
 * Request the data of a measurement file.
 *
 * @param fileName The name of the file
 * @param source The source of the file (a file of several STUs has one source
 *   for every STU). The API needs it for files with more than one source.
 */
export async function fetchFileReader(
    fileName: string,
    source: string | null = null
): Promise<ReadableStreamDefaultReader> {
    const query = source ? `?source=${encodeURIComponent(source)}` : ''
    const response = await fetch(`${getAPILink()}/files/analyze/${fileName}${query}`);
    if (!response.ok) {
        throw new Error(await errorText(response))
    }
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

/*
 * Several sources in one chart (a file of several STUs)
 *
 * Every source has its own clock: its timestamps start at 0 with its first
 * message. The start times of the sources (`start_offset` of the metadata)
 * place them on a common time axis.
 */

export type SourceMeasurement = {
    source: string,
    /** Seconds between the earliest start of all sources and this one */
    offset: number,
    data: DisplayableMeasurement
}

/** Colors of the datasets (enough for four sources with three channels) */
const OVERLAY_COLORS = [
    'black', 'red', 'green', 'blue', 'orange', 'purple',
    'brown', 'teal', 'magenta', 'olive', 'navy', 'gray'
]

/**
 * Combine the data of several sources in one measurement.
 *
 * The datasets are named after their source and shifted by the offset of the
 * source.
 */
export function mergeSources(items: SourceMeasurement[]): DisplayableMeasurement {
    return {
        name: items.map(item => item.data.name)[0] ?? '',
        counter: [],
        timestamp: items[0]?.data.timestamp ?? [],
        datasets: items.flatMap(item => item.data.datasets.map(dataset => ({
            name: `${item.source}: ${dataset.name}`,
            data: item.offset === 0
                ? dataset.data
                : dataset.data.map(point => ({
                    x: (point.x as number) + item.offset,
                    y: point.y
                }))
        })))
    }
}

/**
 * Index of the first point at or after `x` (the length, if there is none).
 * With `after` the first point behind `x`.
 */
function firstIndexFrom(
    points: Array<Chart.ChartPoint>, x: number, after: boolean = false
): number {
    let left = 0
    let right = points.length
    while (left < right) {
        const mid = Math.floor((left + right) / 2)
        const value = points[mid].x as number
        if (after ? value <= x : value < x) left = mid + 1
        else right = mid
    }
    return left
}

/**
 * Get the points of every dataset between two times.
 *
 * Unlike :func:`getSubsetOfMeasurement` every dataset is looked at on its own,
 * since datasets of different sources have different lengths.
 */
export function getSubsetByTime(
    data: DisplayableMeasurement,
    datasetUnits: Array<string>,
    start: number,
    end: number,
    maxPointsPerSet: number = 5000
): Chart.ChartDataSets[] {
    return data.datasets.map((dataset, index) => {
        const from = firstIndexFrom(dataset.data, start)
        // The range includes both ends
        const to = firstIndexFrom(dataset.data, end, true)
        const stride = Math.max(1, Math.ceil((to - from) / maxPointsPerSet))
        const subset: Chart.ChartPoint[] = []
        for (let i = from; i < to; i += stride) {
            subset.push(dataset.data[i])
        }
        return {
            data: subset,
            label: dataset.name,
            pointRadius: 1,
            borderColor: OVERLAY_COLORS[index % OVERLAY_COLORS.length],
            yAxisID: datasetUnits[index]
        }
    })
}

/**
 * Show a time range of merged sources (the whole measurement by default).
 */
export function computeOverlayChart(
    merged: DisplayableMeasurement,
    data: Ref<ChartData<'line'>>,
    boundaries: Ref<ChartBoundaries>,
    datasetUnits: Array<string>,
    start: number | undefined = undefined,
    end: number | undefined = undefined
): void {
    const points = merged.datasets.filter(dataset => dataset.data.length > 0)
    if (points.length === 0) return
    const from = start ?? Math.min(...points.map(set => set.data[0].x as number))
    const to = end ?? Math.max(
        ...points.map(set => set.data[set.data.length - 1].x as number))

    const subsets = getSubsetByTime(merged, datasetUnits, from, to)
    data.value.datasets = subsets as ChartDataset<'line', Chart.Point[]>[]
    const values = subsets
        .flatMap(set => set.data as Chart.ChartPoint[])
        .map(point => point.y as number)
    boundaries.value = {
        xmin: from,
        xmax: to,
        ymin: Math.min(...values),
        ymax: Math.max(...values)
    }
}
