# BatchCreateProductsResponseDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **string** | Operation result status | [default to undefined]
**data** | [**BatchCreateProductsResponseDtoData**](BatchCreateProductsResponseDtoData.md) |  | [optional] [default to undefined]
**errors** | [**Array&lt;BatchCreateProductsResponseDtoErrorsInner&gt;**](BatchCreateProductsResponseDtoErrorsInner.md) | Array of errors (only present when success is false or partial) | [optional] [default to undefined]
**meta** | [**BatchCreateProductsResponseDtoMeta**](BatchCreateProductsResponseDtoMeta.md) |  | [optional] [default to undefined]

## Example

```typescript
import { BatchCreateProductsResponseDto } from './api';

const instance: BatchCreateProductsResponseDto = {
    success,
    data,
    errors,
    meta,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
