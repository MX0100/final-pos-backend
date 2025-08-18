import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsDataUrlUnder1MB(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDataUrlUnder1MB',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string' || !value.startsWith('data:')) return false;
          const commaIndex = value.indexOf(',');
          if (commaIndex < 0) return false;
          const base64Part = value.slice(commaIndex + 1);
          return Math.floor((base64Part.length * 3) / 4) < 1024 * 1024; // < 1MB
        },
        defaultMessage() {
          return 'Image must be a data URL smaller than 1MB';
        },
      },
    });
  };
}
