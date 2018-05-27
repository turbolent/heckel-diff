import { Deletion, Insertion, Move, Update } from '../dist'
import { diff, orderedDiff } from '../dist'

describe('Operation', () => {

  test('equality ', () => {

    // insertion

    {
      const ins = new Insertion(0)
      const ins2 = new Insertion(0)
      expect(ins.equals(ins2)).toBeTruthy()
    }

    {
      const ins = new Insertion(0)
      const ins2 = new Insertion(1)
      expect(ins.equals(ins2)).toBeFalsy()
    }

    // deletion

    {
      const del = new Deletion(0)
      const del2 = new Deletion(0)
      expect(del.equals(del2)).toBeTruthy()
    }

    {
      const del = new Deletion(0)
      const del2 = new Deletion(1)
      expect(del.equals(del2)).toBeFalsy()
    }

    // move

    {
      const mov = new Move(0)
      const mov2 = new Move(0)
      expect(mov.equals(mov2)).toBeTruthy()
    }

    {
      const mov = new Move(0)
      const mov2 = new Move(1)
      expect(mov.equals(mov2)).toBeFalsy()
    }

    // update

    {
      const upd = new Update(0)
      const upd2 = new Update(0)
      expect(upd.equals(upd2)).toBeTruthy()
    }

    {
      const upd = new Update(0)
      const upd2 = new Update(1)
      expect(upd.equals(upd2)).toBeFalsy()
    }

    // different types, same index

    {
      const ins = new Insertion(0)
      const del = new Deletion(0)
      expect(ins.equals(del)).toBeFalsy()
    }

    {
      const ins = new Insertion(0)
      const upd = new Update(0)
      expect(ins.equals(upd)).toBeFalsy()
    }

    {
      const del = new Deletion(0)
      const upd = new Update(0)
      expect(del.equals(upd)).toBeFalsy()
    }
  })

  test('empty arrays', () => {
    const result = diff([], [])
    expect(result.length).toEqual(0)
  })

  test('deletion 1', () => {
    const result = diff(['a'],
                        [])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Deletion(0))).toBeTruthy()
  })

  test('deletion 2', () => {
    const result = diff(['a', 'b', 'c'],
                        ['a', 'c'])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Deletion(1))).toBeTruthy()
  })

  test('deletion 3', () => {
    const result = diff(['a', 'b', 'c'],
                        ['a', 'b'])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Deletion(2))).toBeTruthy()
  })

  test('deletion 4', () => {
    const result = diff(['a', 'b', 'c'],
                        ['b', 'c'])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Deletion(0))).toBeTruthy()
  })

  test('deletion 5', () => {
    const result = diff(['a', 'b', 'c', 'd'],
                        ['b', 'c'])
    expect(result.length).toEqual(2)
    expect(result[0].equals(new Deletion(0))).toBeTruthy()
    expect(result[1].equals(new Deletion(3))).toBeTruthy()
  })

  test('insertion 1', () => {
    const result = diff([],
                        ['a'])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Insertion(0))).toBeTruthy()
  })

  test('insertion 2', () => {
    const result = diff(['a', 'c'],
                        ['a', 'b', 'c'])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Insertion(1))).toBeTruthy()
  })

  test('insertion 3', () => {
    const result = diff(['a', 'b'],
                        ['a', 'b', 'c'])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Insertion(2))).toBeTruthy()
  })

  test('insertion 4', () => {
    const result = diff(['b', 'c'],
                        ['a', 'b', 'c'])
    expect(result.length).toEqual(1)
    expect(result[0].equals(new Insertion(0))).toBeTruthy()
  })

  test('insertion 5', () => {
    const result = diff(['b', 'c'],
                        ['a', 'b', 'c', 'd'])
    expect(result.length).toEqual(2)
    expect(result[0].equals(new Insertion(0))).toBeTruthy()
    expect(result[1].equals(new Insertion(3))).toBeTruthy()
  })

  test('moves', () => {
    const result = diff(['1', '2', '3'],
                        ['2', '3', '1'])
    expect(result.length).toEqual(3)
    expect(result[0].equals(new Move(1, 0))).toBeTruthy()
    expect(result[1].equals(new Move(2, 1))).toBeTruthy()
    expect(result[2].equals(new Move(0, 2))).toBeTruthy()
  })

  test('moves in order', () => {
    const result = orderedDiff(['1', '2', '3'],
                               ['2', '3', '1'])
    expect(result.length).toEqual(6)
    expect(result[0].equals(new Deletion(2))).toBeTruthy()
    expect(result[1].equals(new Deletion(1))).toBeTruthy()
    expect(result[2].equals(new Deletion(0))).toBeTruthy()
    expect(result[3].equals(new Insertion(0))).toBeTruthy()
    expect(result[4].equals(new Insertion(1))).toBeTruthy()
    expect(result[5].equals(new Insertion(2))).toBeTruthy()
  })

  test('moves 2', () => {
    const result = diff(['1', '2', '3', '3', '4'],
                        ['2', '3', '1', '3', '4'])
    expect(result.length).toEqual(3)
    expect(result[0].equals(new Move(1, 0))).toBeTruthy()
    expect(result[1].equals(new Move(2, 1))).toBeTruthy()
    expect(result[2].equals(new Move(0, 2))).toBeTruthy()
  })

  test('moves 2 in order', () => {
    const result = orderedDiff(['1', '2', '3', '3', '4'],
                               ['2', '3', '1', '3', '4'])
    expect(result.length).toEqual(6)
    expect(result[0].equals(new Deletion(2))).toBeTruthy()
    expect(result[1].equals(new Deletion(1))).toBeTruthy()
    expect(result[2].equals(new Deletion(0))).toBeTruthy()
    expect(result[3].equals(new Insertion(0))).toBeTruthy()
    expect(result[4].equals(new Insertion(1))).toBeTruthy()
    expect(result[5].equals(new Insertion(2))).toBeTruthy()
  })

  test('mixed', () => {
    const result = diff(['1', '2', '3', '4'],
                        ['2', '4', '5', '3'])
    expect(result.length).toEqual(4)
    expect(result[0].equals(new Deletion(0))).toBeTruthy()
    expect(result[1].equals(new Move(3, 1))).toBeTruthy()
    expect(result[2].equals(new Insertion(2))).toBeTruthy()
    expect(result[3].equals(new Move(2, 3))).toBeTruthy()
  })

  test('mixed in order', () => {
    const result = orderedDiff(['1', '2', '3', '4'],
                               ['2', '4', '5', '3'])
    expect(result.length).toEqual(6)
    expect(result[0].equals(new Deletion(3))).toBeTruthy()
    expect(result[1].equals(new Deletion(2))).toBeTruthy()
    expect(result[2].equals(new Deletion(0))).toBeTruthy()
    expect(result[3].equals(new Insertion(1))).toBeTruthy()
    expect(result[4].equals(new Insertion(2))).toBeTruthy()
    expect(result[5].equals(new Insertion(3))).toBeTruthy()
  })

  class TestItem {
    constructor(readonly key: number,
                readonly value: number) {}
  }

  test('updates', () => {
    const oldItems = [
      new TestItem(0, 0),
      new TestItem(1, 1),
      new TestItem(2, 2)
    ]

    const newItems = [
      new TestItem(0, 1),
      new TestItem(1, 2),
      new TestItem(2, 3)
    ]

    const result = diff(oldItems, newItems,
                        (item: TestItem) =>
                          item.key,
                        (left: TestItem, right: TestItem) =>
                          left.value === right.value)

    expect(result.length).toEqual(3)
    expect(result[0].equals(new Update(0))).toBeTruthy()
    expect(result[1].equals(new Update(1))).toBeTruthy()
    expect(result[2].equals(new Update(2))).toBeTruthy()
  })

  test('updates in order', () => {
    const oldItems = [
      new TestItem(0, 0),
      new TestItem(1, 1),
      new TestItem(2, 2)
    ]

    const newItems = [
      new TestItem(2, 3),
      new TestItem(1, 1),
      new TestItem(0, 0)
    ]

    const result = orderedDiff(oldItems, newItems,
                               (item: TestItem) =>
                                 item.key,
                               (left: TestItem, right: TestItem) =>
                                 left.value === right.value)

    expect(result.length).toEqual(5)
    expect(result[0].equals(new Deletion(2))).toBeTruthy()
    expect(result[1].equals(new Deletion(0))).toBeTruthy()
    expect(result[2].equals(new Insertion(0))).toBeTruthy()
    expect(result[3].equals(new Insertion(2))).toBeTruthy()
    expect(result[4].equals(new Update(0))).toBeTruthy()
  })

  test('mixed 2', () => {
    const result = diff(['0', '1', '2', '3', '4', '5', '6', '7', '8'],
                        ['0', '2', '3', '4', '7', '6', '9', '5', '10'])
    expect(result.length).toEqual(6)
    expect(result[0].equals(new Deletion(1))).toBeTruthy()
    expect(result[1].equals(new Deletion(8))).toBeTruthy()
    expect(result[2].equals(new Move(7, 4))).toBeTruthy()
    expect(result[3].equals(new Insertion(6))).toBeTruthy()
    expect(result[4].equals(new Move(5, 7))).toBeTruthy()
    expect(result[5].equals(new Insertion(8))).toBeTruthy()
  })

  test('mixed 2 in order', () => {
    const result = orderedDiff(['0', '1', '2', '3', '4', '5', '6', '7', '8'],
                               ['0', '2', '3', '4', '7', '6', '9', '5', '10'])
    expect(result.length).toEqual(8)
    expect(result[0].equals(new Deletion(8))).toBeTruthy()
    expect(result[1].equals(new Deletion(7))).toBeTruthy()
    expect(result[2].equals(new Deletion(5))).toBeTruthy()
    expect(result[3].equals(new Deletion(1))).toBeTruthy()
    expect(result[4].equals(new Insertion(4))).toBeTruthy()
    expect(result[5].equals(new Insertion(6))).toBeTruthy()
    expect(result[6].equals(new Insertion(7))).toBeTruthy()
    expect(result[7].equals(new Insertion(8))).toBeTruthy()
  })

  test('delete equal objects', () => {
    const result = diff(['0', '0', '0', '0'], ['0', '0'])
    expect(result.length).toEqual(2)
  })

  test('insert equal objects', () => {
    const result = diff(['0', '0'], ['0', '0', '0', '0'])
    expect(result.length).toEqual(2)
  })
})
