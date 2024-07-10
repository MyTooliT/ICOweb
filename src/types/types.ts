export type Dict<Key extends keyof any, Value> = {
    [key in Key]: Value;
}

// TYPOGRAPHY

// NOTE: Why this approach? For testing purposes - the array is iterable.
//       https://danielbarta.com/literal-iteration-typescript/
export const HeadingVariants = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6'] as const
export type HeadingVariant = typeof HeadingVariants[number]