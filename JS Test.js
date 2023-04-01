function dynamic_fields(module, module_fields, token) {
  try {
    const schemas = {
      users: { schema: user_schema },
      stages: { schema: stage_schema },
      pipelines: { schema: pipeline_schema }
    };

    if (schemas[module]) {
      return schemas[module];
    }
    let fixedSchema = { schema: [], fields: [] };
    let semantic_group, semantic_type, concept_type, data_type;
    let datas = { "user": { "id": "NUMERIC", "name": "TEXT", "email": "TEXT", "active_flag": "BOOLEAN", "value": "NUMERIC" }, "person": { "active_flag": "BOOLEAN", "name": "TEXT", "email": "TEXT", "phone": "TEXT", "owner_id": "NUMERIC", "value": "NUMERIC" }, "people": { "active_flag": "BOOLEAN", "name": "TEXT", "email": "TEXT", "phone": "TEXT", "owner_id": "NUMERIC", "value": "NUMERIC" }, "org": { "name": "TEXT", "people_count": "NUMERIC", "owner_id": "NUMERIC", "address": "TEXT", "active_flag": "BOOLEAN", "cc_email": "TEXT", "value": "NUMERIC" }, "deal": { "name": "TEXT", "id": "NUMERIC" }, "lead": { "name": "TEXT", "id": "NUMERIC" } };
    let semantics_data = { "all": { "semanticGroup": "TEXT" , "semanticType": "TEXT" , "conceptType": "DIMENSION" }, "date": { "semanticGroup": "DATE_TIME",  "semanticType": "YEAR_MONTH_DAY_SECOND",  "conceptType": "DIMENSION" }, "int": { "semanticGroup": "NUMERIC", "semanticType": "NUMBER", "conceptType": "METRIC" },"stage": { "semanticGroup": "NUMERIC", "semanticType": "NUMBER" , "conceptType": "METRIC" }, "double": { "semanticGroup": "NUMERIC", "semanticType": "NUMBER", "conceptType": "METRIC" }, "monetary": { "semanticGroup": "CURRENCY", "semanticType": "CURRENCY_INR", "conceptType": "METRIC" }, "boolean": {"semanticGroup": "BOOLEAN", "semanticType": "BOOLEAN", "conceptType": "METRIC" }, "picture": { "semanticGroup": "URL", "semanticType": "IMAGE", "conceptType": "DIMENSION" }}
    let datatype_data = { "all": "STRING", "date": "STRING", "int": "NUMBER", "stage": "NUMBER", "double": "NUMBER", "monetary": "NUMBER", "boolean": "BOOLEAN", "picture": "STRING", }
    let response = JSON.parse(UrlFetchApp.fetch(`https://api.pipedrive.com/v1/${module_fields}/?start=0&limit=500&api_token=${token}`));
    let results = response.data;
    if (module == 'leads') {
      results = results.filter(({ edit_flag }) => edit_flag == true);
      fixedSchema['schema'] = leads_schema;
    }
    results.forEach(function (field) {
      let dataSchema = {
        name: field.key,
        label: field.name,
        dataType: datatype_data[field.field_type] ? datatype_data[field.field_type] : datatype_data['all'],
        fieldType: field.field_type,
        options: field.options,
        semantics: semantics_data[field.field_type] ? semantics_data[field.field_type] : semantics_data['all']
      }

      if (field.key == 'next_activity_date' || field.key == 'last_activity_date') {
        let dataSchema_local = {
          name: field.key,
          label: field.name,
          dataType: datatype_data[field.field_type] ? datatype_data[field.field_type] : datatype_data['all'],
          fieldType: field.field_type,
          options: field.options,
          semantics: {
            semanticType: 'YEAR_MONTH_DAY',
            semanticGroup: 'DATE_TIME',
            conceptType: 'DIMENSION',
          }
        }
        fixedSchema['schema'].push(dataSchema_local);
      }
      if (field.key == 'pipeline' && module_fields == 'dealFields') {
        let dataSchema_local = {
          name: 'pipeline_id',
          label: field.name,
          dataType: 'NUMBER',
          fieldType: field.field_type,
          options: field.options,
          semantics: {
            semanticGroup: "NUMERIC", 
            semanticType: "NUMBER", 
            conceptType: "METRIC"
          }
        }
        fixedSchema['schema'].push(dataSchema_local);
      }
      if (field.key == 'type' && module_fields == 'activityFields') {
        let dataSchema_local = {
          name: field.key,
          label: field.name,
          dataType: datatype_data[field.field_type] ? datatype_data[field.field_type] : datatype_data['all'],
          fieldType: field.field_type,
          options: attributeOptions(token, ['key_string', 'name'], 'activityTypes'),
          semantics: {
            semanticType: 'TEXT',
            semanticGroup: 'TEXT',
            conceptType: 'DIMENSION',
          }
        }
        fixedSchema['schema'].push(dataSchema_local);
      } else if (field.field_type === 'user' || field.field_type == 'person' || field.field_type == 'people' || field.field_type == 'org' || field.field_type == 'deal' || field.field_type == 'lead') {
        let dataSchema_local;
        Object.keys(datas[field.field_type]).forEach(function (data) {
          switch (datas[field.field_type][data]) {
            case 'NUMERIC':
              semantic_group = 'NUMERIC';
              semantic_type = 'NUMBER';
              concept_type = 'METRIC'
              data_type = 'NUMBER';
              break;
            case 'BOOLEAN':
              semantic_group = 'BOOLEAN';
              semantic_type = 'BOOLEAN';
              concept_type = 'METRIC'
              data_type = 'BOOLEAN';
              break;
            default:
              semantic_group = 'TEXT';
              semantic_type = 'TEXT';
              concept_type = 'DIMENSION';
              data_type = 'STRING';
              break;
          }
          dataSchema_local = {
            name: field.key + "." + data,
            label: field.name + "_" + data,
            dataType: data_type,
            fieldType: field.field_type,
            options: null,
            semantics: {
              conceptType: concept_type,
              semanticType: semantic_type,
              semanticGroup: semantic_group,
            }
          }
          fixedSchema['schema'].push(dataSchema_local);
        })
      } else {
        fixedSchema['schema'].push(dataSchema);
      }
    });
    return fixedSchema;
  } catch (e) {
    console.error(e);
  }
}
