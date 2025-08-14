import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsDataUrlUnder1MB(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDataUrlUnder1MB',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          // Basic data URL check
          if (!value.startsWith('data:')) return false;
          const commaIndex = value.indexOf(',');
          if (commaIndex < 0) return false;
          const base64Part = value.slice(commaIndex + 1);
          // Rough size estimation: base64 expands by ~4/3
          const bytes = Math.floor((base64Part.length * 3) / 4);
          return bytes < 1024 * 1024;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a data URL smaller than 1MB`;
        },
      },
    });
  };
}
