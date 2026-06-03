export type CollectionState<T> =
  | { kind: 'error'; data: T[] }
  | { kind: 'empty'; data: T[] }
  | { kind: 'success'; data: T[] };

export function getCollectionState<T>(value: T[] | null): CollectionState<T> {
  if (value === null) {
    return { kind: 'error', data: [] };
  }

  if (value.length === 0) {
    return { kind: 'empty', data: value };
  }

  return { kind: 'success', data: value };
}
