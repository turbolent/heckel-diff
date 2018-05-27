
/// Used to represent the operation to perform on the source array.
/// Indices indicate the position at which to perform the given operation.
///
/// - Insertion: Insert a new value at the given index.
/// - Deletion: Delete a value at the given index.
/// - Move: Move a value from the given origin index, to the given destination index.
/// - Update: Update the value at the given index.

export interface Operation {
  equals(other: Operation): boolean
}

export class Insertion implements Operation {

  constructor(readonly index: number) {}

  equals(other: Operation): boolean {
    return other instanceof Insertion
      && this.index === other.index
  }
}

export class Deletion implements Operation {

  constructor(readonly index: number) {}

  equals(other: Operation): boolean {
    return other instanceof Deletion
      && this.index === other.index
  }
}

export class Move implements Operation {

  constructor(readonly fromIndex: number,
              readonly toIndex: number) {}

  equals(other: Operation): boolean {
    return other instanceof Move
      && this.fromIndex === other.fromIndex
      && this.toIndex === other.toIndex
  }
}

export class Update implements Operation {

  constructor(readonly index: number) {}

  equals(other: Operation): boolean {
    return other instanceof Update
      && this.index === other.index
  }
}

export type Op = Insertion | Deletion | Move | Update

export enum Counter {
  ZERO,
  ONE,
  MANY
}

export function incrementCounter(counter: Counter): Counter {
  switch (counter) {
    case Counter.ZERO:
      return Counter.ONE
    case Counter.ONE:
      return Counter.MANY
    case Counter.MANY:
      return Counter.MANY
  }
}

export class SymbolEntry {

  constructor(public oc: Counter = Counter.ZERO,
              public nc: Counter = Counter.ZERO,
              public olno: number[] = []) {}

  get occursInBoth(): boolean {
    return this.oc !== Counter.ZERO
      && this.nc !== Counter.ZERO
  }
}

export class Index {
  constructor(readonly index: number) {}
}

export type Entry = SymbolEntry | Index

function identity<T>(t: T): T {
  return t
}

/// Returns a diff, given an old and a new representation of a given collection (such as an `Array`).
/// The return value is an array of `Op` values, each which instructs how to transform the old
/// collection into the new collection.
///
/// - parameter oldItems: The old collection.
/// - parameter newItems: The new collection.
/// - returns: An array of `Op` values, representing the diff.
///
/// Based on http://dl.acm.org/citation.cfm?id=359467,
//  ported from https://github.com/mcudich/HeckelDiff
///
/// And other similar implementations at:
/// * https://github.com/Instagram/IGListKit
/// * https://github.com/andre-alves/PHDiff
///
export function diff<T>(oldItems: T[],
                        newItems: T[],
                        key: (item: T) => any = identity,
                        equal?: (oldItem: T, newItem: T) => boolean): Op[] {

  const table = new Map<any, SymbolEntry>()
  const oa: Entry[] = []
  const na: Entry[] = []

  // Pass 1 comprises the following:
  // (a) each line i of file N is read in sequence;
  // (b) a symbol table entry for each line i is created if it does not already exist;
  // (c) NC for the line's symbol table entry is incremented; and
  // (d) NA [i] is set to point to the symbol table entry of line i.
  newItems.forEach((item) => {
    const itemKey = key(item)
    const entry = table.get(itemKey) || new SymbolEntry()
    table.set(itemKey, entry)
    entry.nc = incrementCounter(entry.nc)
    na.push(entry)
  })

  // Pass 2 is identical to pass 1 except that it acts on file O, array OA, and counter OC,
  // and OLNO for the symbol table entry is set to the line's number.

  oldItems.forEach((item, index) => {
    const itemKey = key(item)
    const entry = table.get(itemKey) || new SymbolEntry()
    table.set(itemKey, entry)
    entry.oc = incrementCounter(entry.oc)
    entry.olno.push(index)
    oa.push(entry)
  })

  // In pass 3 we use observation 1 and process only those lines having NC = OC = 1. Since each
  // represents (we assume) the same unmodified line, for each we replace the symbol table pointers
  // in NA and OA by the number of the line in the other file. For example, if NA[i] corresponds to
  // such a line, we look NA[i] up in the symbol table and set NA[i] to OLNO and OA[OLNO] to i.
  // In pass 3 we also "find" unique virtual lines immediately before the first and immediately
  // after the last lines of the files.

  na.forEach((item, index) => {
    if (!(item instanceof SymbolEntry)) {
      return
    }
    const entry = item

    if (!entry.occursInBoth) {
      return
    }

    const oldIndex = entry.olno.shift()
    if (oldIndex === undefined) {
      return
    }

    na[index] = new Index(oldIndex)
    oa[oldIndex] = new Index(index)
  })

  // In pass 4, we apply observation 2 and process each line in NA in ascending order:
  // If NA[i] points to OA[j] and NA[i + 1] and OA[j + 1] contain identical symbol table
  // entry pointers, then OA[j + 1] is set to line i + 1 and NA[i + 1] is set to line j + 1.

  for (let i = 1; i < na.length - 1; i += 1) {
    const entry = na[i]

    if (!(entry instanceof Index)) {
      continue
    }

    const j = entry.index
    if (j + 1 >= oa.length) {
      continue
    }

    const newEntry = na[i + 1]
    if (!(newEntry instanceof SymbolEntry)) {
      continue
    }

    const oldEntry = oa[j + 1]
    if (!(oldEntry instanceof SymbolEntry)) {
      continue
    }

    if (newEntry !== oldEntry) {
      continue
    }

    na[i + 1] = new Index(j + 1)
    oa[j + 1] = new Index(i + 1)
  }

  // In pass 5, we also apply observation 2 and process each entry in descending order:
  // if NA[i] points to OA[j] and NA[i - 1] and OA[j - 1] contain identical symbol table pointers,
  // then NA[i - 1] is replaced by j - 1 and OA[j - 1] is replaced by i - 1.

  for (let i = na.length - 1; i > 0; i -= 1) {
    const entry = na[i]
    if (!(entry instanceof Index)) {
      continue
    }

    const j = entry.index

    if (j - 1 < 0) {
      continue
    }

    const newEntry = na[i - 1]
    if (!(newEntry instanceof SymbolEntry)) {
      continue
    }

    const oldEntry = oa[j - 1]
    if (!(oldEntry instanceof SymbolEntry)) {
      continue
    }

    if (newEntry !== oldEntry) {
      continue
    }

    na[i - 1] = new Index(j - 1)
    oa[j - 1] = new Index(i - 1)
  }

  // calculate operations

  const ops: Op[] = []

  const deleteOffsets = new Map<number, number>()

  {
    let runningOffset = 0

    oa.forEach((item, index) => {
      deleteOffsets.set(index, runningOffset)

      if (!(item instanceof SymbolEntry)) {
        return
      }

      ops.push(new Deletion(index))
      runningOffset += 1
    })
  }

  {
    let runningOffset = 0

    na.forEach((item, index) => {

      if (item instanceof SymbolEntry) {
        ops.push(new Insertion(index))
        runningOffset += 1
      } else {

        const oldIndex = item.index

        // The object has changed, so it should be updated.
        if (equal && !equal(oldItems[oldIndex], newItems[index])) {
          ops.push(new Update(index))
        }

        const deleteOffset = deleteOffsets.get(oldIndex) || 0
        // The object is not at the expected position, so move it.
        if ((oldIndex - deleteOffset + runningOffset) !== index) {
          ops.push(new Move(oldIndex, index))
        }
      }
    })
  }

  return ops
}

/// Similar to to `diff`, except that this returns the same set of operations but in an order
/// that can be applied step-wise to transform the old array into the new one.
///
/// - parameter oldItems: The old collection.
/// - parameter newItems: The new collection.
/// - returns: An array of `Op` values, representing the diff.
///
export function orderedDiff<T>(oldItems: T[],
                               newItems: T[],
                               key: (item: T) => any = identity,
                               equal?: (oldItem: T, newItem: T) => boolean): Op[] {

  const operations = diff(oldItems, newItems, key, equal)

  const insertions: Op[] = []
  const updates: Op[] = []
  const possibleDeletions = new Map<number, Deletion>()

  function trackDeletion(fromIndex: number, deletion: Deletion) {
    if (possibleDeletions.get(fromIndex) === undefined) {
      possibleDeletions.set(fromIndex, deletion)
    }
  }

  operations.forEach((operation) => {
    if (operation instanceof Insertion) {
      insertions.push(operation)
    } else if (operation instanceof Deletion) {
      trackDeletion(operation.index, operation)
    } else if (operation instanceof Move) {
      insertions.push(new Insertion(operation.toIndex))
      trackDeletion(operation.fromIndex, new Deletion(operation.fromIndex))
    } else if (operation instanceof Update) {
      updates.push(operation)
    }
  })

  const deletions: Op[] =
    Array.from(possibleDeletions.values())
      .sort((a, b) => {
        if (a.index < b.index) {
          return -1
        }
        if (a.index > b.index) {
          return 1
        }
        return 0
      })
      .reverse()

  return deletions.concat(insertions).concat(updates)
}
