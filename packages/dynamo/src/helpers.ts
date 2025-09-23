import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * verifica si una operación fue exitosa
 */
export function wasSuccessful(response: any): boolean {
  return (
    response?.$metadata?.httpStatusCode >= 200 &&
    response?.$metadata?.httpStatusCode < 300
  );
}

/**
 * serializa un objeto para dynamodb
 */
export function serializeItem(item: any): any {
  return unmarshall(marshall(item, { removeUndefinedValues: true }));
}

/**
 * construye una expresión de actualización
 */
export function buildUpdateExpression(attributes: Record<string, any>): {
  UpdateExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, any>;
} {
  const updateExpression =
    "SET " +
    Object.keys(attributes)
      .map((_, index) => `#key${index} = :value${index}`)
      .join(", ");

  const expressionAttributeNames = Object.keys(attributes).reduce(
    (acc, key, index) => ({ ...acc, [`#key${index}`]: key }),
    {}
  );

  const expressionAttributeValues = Object.values(attributes).reduce(
    (acc, value, index) => ({ ...acc, [`:value${index}`]: value }),
    {}
  );

  return {
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };
}
