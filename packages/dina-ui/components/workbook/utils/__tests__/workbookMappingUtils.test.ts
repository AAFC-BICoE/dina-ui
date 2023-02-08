import {
  convertMap,
  convertNumber,
  convertNumberArray,
  convertStringArray,
  getColumnHeaders,
  getDataFromWorkbook,
  isBoolean,
  isMap,
  isNumber,
} from '../workbookMappingUtils';

describe('workbookMappingUtils functions', () => {
  describe('getColumnHeaders', () => {
    test('Basic spreadsheet provided, returns the array of the first column', async () => {
      expect(
        getColumnHeaders(
          {
            '0': [
              { rowNumber: 0, content: ['header1', 'header2', 'header3'] },
              { rowNumber: 1, content: ['data1', 'data2', 'data3'] },
            ],
            '1': [
              { rowNumber: 0, content: ['header4', 'header5', 'header6'] },
              { rowNumber: 1, content: ['data4', 'data5', 'data6'] },
            ],
          },
          0 // Return first sheet.
        )
      ).toEqual(['header1', 'header2', 'header3']);

      expect(
        getColumnHeaders(
          {
            '0': [
              { rowNumber: 0, content: ['header1', 'header2', 'header3'] },
              { rowNumber: 1, content: ['data1', 'data2', 'data3'] },
            ],
            '1': [
              { rowNumber: 0, content: ['header4', 'header5', 'header6'] },
              { rowNumber: 1, content: ['data4', 'data5', 'data6'] },
            ],
          },
          1 // Return first sheet.
        )
      ).toEqual(['header4', 'header5', 'header6']);
    });

    test('Blank first row, use next row as headers', async () => {
      expect(
        getColumnHeaders(
          {
            '0': [
              {
                rowNumber: 0,
                content: [],
              },
              {
                rowNumber: 1,
                content: ['header1', 'header2', 'header3'],
              },
              {
                rowNumber: 2,
                content: ['data1', 'data2', 'data3'],
              },
            ],
          },
          0
        )
      ).toEqual(['header1', 'header2', 'header3']);
    });

    test('Return null if not a valid spreadsheet.', async () => {
      expect(
        getColumnHeaders(
          {
            '0': [
              {
                rowNumber: 0,
                content: [],
              },
            ],
          },
          0
        )
      ).toBeNull();
    });
  });

  describe('getData', () => {
    test('get data success', () => {
      expect(
        getDataFromWorkbook(
          {
            '0': [
              { rowNumber: 0, content: ['header1', 'header2', 'header3'] },
              { rowNumber: 1, content: ['dataA1', 'dataA2', 'dataA3'] },
              { rowNumber: 2, content: ['dataB1', 'dataB2', 'dataB3'] },
              { rowNumber: 3, content: ['dataC1', 'dataC2', 'dataC3'] },
            ],
            '1': [
              { rowNumber: 0, content: ['header4', 'header5', 'header6'] },
              { rowNumber: 1, content: ['data4', 'data5', 'data6'] },
            ],
          },
          0, // Return first sheet.
          ['field1', 'field2', 'field3']
        )
      ).toEqual([
        {
          field1: 'dataA1',
          field2: 'dataA2',
          field3: 'dataA3',
        },
        {
          field1: 'dataB1',
          field2: 'dataB2',
          field3: 'dataB3',
        },
        {
          field1: 'dataC1',
          field2: 'dataC2',
          field3: 'dataC3',
        },
      ]);
    });
  });

  it('isNumber', () => {
    expect(isNumber('111')).toBeTruthy();
    expect(isNumber('adf')).toBeFalsy();
    expect(isNumber('true')).toBeFalsy();
    expect(isNumber(null)).toBeFalsy();
    expect(isNumber(undefined)).toBeFalsy();
  });

  it('isBoolean', () => {
    expect(isBoolean('true')).toBeTruthy();
    expect(isBoolean('false')).toBeTruthy();
    expect(isBoolean('yes')).toBeTruthy();
    expect(isBoolean('no')).toBeTruthy();
    expect(isBoolean('adf')).toBeFalsy();
  });

  it('isMap', () => {
    expect(isMap('asdfa : asdfas')).toBeTruthy();
    expect(isMap('asdfas: asdfas, adsfasf:asdfasf')).toBeTruthy();
    expect(isMap('asdf:"asdfa  sdfdsf"')).toBeTruthy();
    expect(isMap('asdf:"asdfa sdfdsf" : asd : "sdfsdf "sdf sdf')).toBeFalsy();
    expect(isMap('asdf')).toBeFalsy();
    expect(isMap('asdf:"asdfa sdfdsf')).toBeFalsy();
    expect(isMap('asdf:asdfa sdfdsf", "sdfsdf "sdf sdf')).toBeFalsy();
    expect(isMap('asdf:"asdfa sdfdsf", asd : "sdfsdf "sdf sdf')).toBeFalsy();
  });

  it('convertNumber', () => {
    expect(convertNumber('100')).toEqual(100);
    expect(convertNumber('ssss')).toBeNaN();
    expect(convertNumber(false)).toEqual(0);
    expect(convertNumber(true)).toEqual(1);
    expect(convertNumber(null)).toBeNull();
    expect(convertNumber(undefined)).toBeUndefined();
  });

  it('convertStringArray', () => {
    expect(convertStringArray('abc, def')).toEqual(['abc', 'def']);
    expect(convertStringArray('abc,"def,ddd"')).toEqual(['abc', 'def,ddd']);
  });

  it('convertNumberArray', () => {
    expect(convertNumberArray('111, 222')).toEqual([111, 222]);
    expect(convertNumberArray('111, 222.22, abcdef, false, ')).toEqual([111, 222.22]);
  });

  it('convertMap', () => {
    expect(convertMap('key1:value1, key2 : 2, key3 : false')).toEqual({
      key1: 'value1',
      key2: 2,
      key3: false,
    });
    expect(convertMap('key1:"value1 with , and :"')).toEqual({
      key1: 'value1 with , and :',
    });
    expect(convertMap('key1: , :value2, key3:value3')).toEqual({
      key3: 'value3',
    });
    expect(convertMap('223:value3')).toEqual({ '223': 'value3' });
    expect(convertMap('223ddd:value3')).toEqual({ '223ddd': 'value3' });
  });
});
