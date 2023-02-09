import { FieldWrapper, SelectField, SubmitButton } from 'common-ui/lib';
import { DinaForm } from 'common-ui/lib/formik-connected/DinaForm';
import { FieldArray } from 'formik';
import { useMemo, useState, useEffect, Ref, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import Select from 'react-select';
import { DinaMessage, useDinaIntl } from '../../intl/dina-ui-intl';
import { WorkbookJSON } from './types/Workbook';
import FieldMappingConfig from './utils/FieldMappingConfig.json';
import { useMateriaSampleConverter } from './utils/useMaterialSampleConverter';
import {
  getColumnHeaders,
  findMatchField,
  getDataFromWorkbook,
  isBoolean,
  isMap,
  isNumber,
  isNumberArray,
  isBooleanArray,
} from './utils/workbookMappingUtils';
import { FormikProps } from 'formik';
import { compact, groupBy } from 'lodash';
import * as yup from 'yup';
import { ValidationError } from 'yup';
import { DataTypeEnum } from './utils/useFieldConverters';

export type FieldMapType = (string | undefined)[];

export interface WorkbookColumnMappingFields {
  sheet: number;
  type: string;
  fieldMap: FieldMapType;
}

export interface WorkbookColumnMappingProps {
  spreadsheetData: WorkbookJSON;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

const ENTITY_TYPES = ['materialSample'] as const;

export function WorkbookColumnMapping({ spreadsheetData, performSave, setPerformSave }: WorkbookColumnMappingProps) {
  const formRef: Ref<FormikProps<Partial<WorkbookColumnMappingFields>>> = useRef(null);
  const { formatMessage } = useDinaIntl();
  const entityTypes = ENTITY_TYPES.map((entityType) => ({
    label: formatMessage(entityType),
    value: entityType,
  }));
  const [sheet, setSheet] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<{
    label: string;
    value: string;
  } | null>(entityTypes[0]);
  const [fieldMap, setFieldMap] = useState([] as FieldMapType);
  const [fieldHeaderPair, setFieldHeaderPair] = useState({} as {[field: string]: string});
  const { convertEntity } = useMateriaSampleConverter(
    FieldMappingConfig as {
      [key: string]: { [field: string]: { dataType: DataTypeEnum } };
    }
  );

  const buttonBar = (
    <>
      <SubmitButton className='hidden' performSave={performSave} setPerformSave={setPerformSave} />
    </>
  );

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet);
  }, [sheet]);

  // Generate sheet dropdown options
  const sheetOptions = useMemo(() => {
    return Object.entries(spreadsheetData).map(([sheetNumberString, _]) => {
      const sheetNumber = +sheetNumberString;
      // This label is hardcoded for now, it will eventually be replaced with the sheet name in a
      // future ticket.
      return { label: 'Sheet ' + (sheetNumber + 1), value: sheetNumber };
    });
  }, [spreadsheetData]);

  // Generate field options
  const fieldOptions = useMemo(() => {
    if (!!selectedType?.value) {
      const filedsConfigs: { [field: string]: { dataType: DataTypeEnum } } = FieldMappingConfig[selectedType?.value];
      const newFieldOptions: { label: string; value: string }[] = [];
      Object.keys(filedsConfigs).forEach((field) => {
        const option = {
          label: formatMessage(`field_${field}` as any),
          value: field,
        };
        newFieldOptions.push(option);
      });
      const map = [] as FieldMapType;
      const _fieldHeaderPair = {};
      for (const columnHeader of headers || []) {
        const field = findMatchField(columnHeader, newFieldOptions)?.value;
        if (field != undefined) {
          _fieldHeaderPair[field]=columnHeader;
        }
        map.push(field);
      }
      setFieldMap(map);
      setFieldHeaderPair(_fieldHeaderPair);
      return newFieldOptions;
    } else {
      return [];
    }
  }, [selectedType]);

  // Generate the currently selected value
  const sheetValue = sheetOptions[sheet];

  function onSubmit(value) {
    console.log(value);
  }

  const workbookColumnMappingFormSchema = yup.object({
    fieldMap: yup.array().test({
      name: 'uniqMapping',
      exclusive: false,
      test: (fieldNames: string[]) => {
        const errors: ValidationError[] = [];
        for (const i in fieldNames) {
          const field = fieldNames[i];
          if (!!field && fieldNames.filter((item) => item === field).length > 1) {
            errors.push(new ValidationError(formatMessage('workBookDuplicateFieldMap'), field, `fieldMap[${i}]`));
          }
        }
        if (errors.length > 0) {
          return new ValidationError(errors);
        }
        const data = getDataFromWorkbook(spreadsheetData, sheet, fieldNames);
        validateData(data, errors);
        if (errors.length > 0) {
          return new ValidationError(errors);
        }
        return true;
      },
    }),
  });

  function validateData(data: { [field: string]: string }[], errors: ValidationError[]) {
    if (!!selectedType?.value) {
      const filedsConfigs: { [field: string]: { dataType: DataTypeEnum } } = FieldMappingConfig[selectedType?.value];
      for (const i in data) {
        const row = data[i];
        for (const field of Object.keys(row)) {
          const param = {
            "sheet": (sheet+1), 
            "index": (+i+1), 
            "field": fieldHeaderPair[field]
          };
          switch (filedsConfigs[field].dataType) {
            case DataTypeEnum.BOOLEAN:
              if (!isBoolean(row[field])) {
                param["dataType"] = DataTypeEnum.BOOLEAN;
                errors.push(
                  new ValidationError(
                    formatMessage('workBookInvalidDataFormat', param),
                    field,
                    'sheet'
                  )
                );
              }
              break;
            case DataTypeEnum.NUMBER:
              if(!isNumber(row[field])) {
                param["dataType"] = DataTypeEnum.NUMBER;
                errors.push(
                  new ValidationError(
                    formatMessage('workBookInvalidDataFormat', param),
                    field,
                    'sheet'
                  )
                );
              }
              break;
            case DataTypeEnum.NUMBER_ARRAY:
              if(!isNumberArray(row[field])) {
                param["dataType"] = DataTypeEnum.NUMBER_ARRAY;
                errors.push(
                  new ValidationError(
                    formatMessage('workBookInvalidDataFormat', param),
                    field,
                    'sheet'
                  )
                );
              }
              break;
            case DataTypeEnum.BOOLEAN_ARRAY:
              if(!isBooleanArray(row[field])) {
                param["dataType"] = DataTypeEnum.BOOLEAN_ARRAY;
                errors.push(
                  new ValidationError(
                    formatMessage('workBookInvalidDataFormat', param),
                    field,
                    'sheet'
                  )
                );
              }
              break;
            case DataTypeEnum.MAP:
              if(!isMap(row[field])) {
                param["dataType"] = DataTypeEnum.MAP;
                errors.push(
                  new ValidationError(
                    formatMessage('workBookInvalidDataFormat', param),
                    field,
                    'sheet'
                  )
                );
              }
              break;
            case DataTypeEnum.NUMBER:
              if(!isNumber(row[field])) {
                errors.push(
                  new ValidationError(
                    formatMessage('workBookInvalidDataFormat', param),
                    field,
                    'sheet'
                  )
                );
              }
              break;
          }
        }
      }
    }
    return errors;
  }

  return (
    <DinaForm<Partial<WorkbookColumnMappingFields>>
      initialValues={{
        sheet: 1,
        type: 'materialSample',
        fieldMap,
      }}
      innerRef={formRef}
      onSubmit={onSubmit}
      validationSchema={workbookColumnMappingFormSchema}
    >
      {buttonBar}
      <FieldArray name='fieldMap'>
        {() => {
          return (
            <>
              <div className='mb-3 border card px-4 py-2'>
                <div className='list-inline d-flex flex-row gap-4 pt-2'>
                  <FieldWrapper name='sheet' className='flex-grow-1'>
                    <Select
                      value={sheetValue}
                      options={sheetOptions}
                      onChange={(newOption) => setSheet(newOption?.value ?? 0)}
                    />
                  </FieldWrapper>
                  <FieldWrapper name='type' className='flex-grow-1'>
                    <Select
                      isDisabled={entityTypes.length === 1}
                      value={selectedType}
                      onChange={(entityType) => setSelectedType(entityType)}
                      options={entityTypes}
                    />
                  </FieldWrapper>
                </div>
              </div>

              {/* Column Header Mapping Table */}
              <Table>
                <thead>
                  <tr>
                    <th>
                      <DinaMessage id='spreadsheetHeader' />
                    </th>
                    <th>
                      <DinaMessage id='materialSampleFieldsMapping' />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {headers
                    ? headers.map((columnHeader, index) => (
                        <tr key={columnHeader}>
                          <td>{columnHeader}</td>
                          <td>
                            <SelectField name={`fieldMap[${index}]`} options={fieldOptions} hideLabel={true} />
                          </td>
                        </tr>
                      ))
                    : undefined}
                </tbody>
              </Table>
            </>
          );
        }}
      </FieldArray>
    </DinaForm>
  );
}
