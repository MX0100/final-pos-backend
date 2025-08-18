# UpdateProductDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Product name | [optional] [default to undefined]
**description** | **string** | Product description | [optional] [default to undefined]
**image** | **string** | Base64 data URL (&lt;1MB) | [optional] [default to undefined]
**price** | **number** | Product price | [optional] [default to undefined]
**stock** | **number** | Stock quantity | [optional] [default to undefined]
**category** | **string** | Product category | [optional] [default to undefined]

## Example

```typescript
import { UpdateProductDto } from './api';

const instance: UpdateProductDto = {
    name,
    description,
    image,
    price,
    stock,
    category,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
