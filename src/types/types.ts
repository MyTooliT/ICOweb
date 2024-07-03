export type Dict<Key extends keyof any, Value> = {
    [key in Key]: Value;
}