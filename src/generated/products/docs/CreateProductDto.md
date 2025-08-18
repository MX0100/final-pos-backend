# CreateProductDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** |  | [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**image** | **string** | Base64 data URL (&lt;1MB) | [default to undefined]
**price** | **number** | Price as numeric value | [default to undefined]
**stock** | **number** |  | [default to undefined]
**category** | **string** | Product category | [optional] [default to undefined]

## Example

```typescript
import { CreateProductDto } from './api';

const instance: CreateProductDto = {
    name,
    description,
    image,
    price,
    stock,
    category,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
