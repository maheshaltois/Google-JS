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

    const fixedSchema = { schema: [], fields: [] };
    const response = JSON.parse(UrlFetchApp.fetch(`https://api.pipedrive.com/v1/${module_fields}/?start=0&limit=500&api_token=${token}`));
    const results = module === 'leads' ? response.data.filter(({ edit_flag }) => edit_flag) : response.data;
    
    if (module === 'leads') {
      fixedSchema['schema'] = leads_schema;
    }

    results.forEach(field => {
      const dataSchema = processDataField(field, module_fields, token);
      fixedSchema['schema'].push(dataSchema);
    });

    return fixedSchema;
  } catch (e) {
    console.error(e);
  }
}

function processDataField(field, module_fields, token) {
  const datatype_data = { all: "STRING", date: "STRING", int: "NUMBER", stage: "NUMBER", double: "NUMBER", monetary: "NUMBER", boolean: "BOOLEAN", picture: "STRING" };
  const dataType = datatype_data[field.field_type] || datatype_data['all'];
  const semantics = generateSemantics(field, dataType);

  let dataSchema = { name: field.key, label: field.name, dataType, fieldType: field.field_type, options: field.options, semantics };

  if (field.key === 'next_activity_date' || field.key === 'last_activity_date') {
    dataSchema.semantics = { semanticType: 'YEAR_MONTH_DAY', semanticGroup: 'DATE_TIME', conceptType: 'DIMENSION' };
  }

  if (field.key === 'pipeline' && module_fields === 'dealFields') {
    dataSchema = { ...dataSchema, name: 'pipeline_id', dataType: 'NUMBER', semantics: semantics['NUMBER'] };
  }

  if (field.key === 'type' && module_fields === 'activityFields') {
    dataSchema = { ...dataSchema, options: attributeOptions(token, ['key_string', 'name'], 'activityTypes'), semantics: semantics['STRING'] };
  }

  return dataSchema;
}

function generateSemantics(field, dataType) {
  const semantics_data = {
    STRING: { semanticGroup: "TEXT", semanticType: "TEXT", conceptType: "DIMENSION" },
    NUMBER: { semanticGroup: "NUMERIC", semanticType: "NUMBER", conceptType: "METRIC" },
    BOOLEAN: { semanticGroup: "BOOLEAN", semanticType: "BOOLEAN", conceptType: "METRIC" }
  };

  return semantics_data[dataType];
}
