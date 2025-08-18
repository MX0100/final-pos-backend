# UpdateCartResponseDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **string** | Operation result status | [default to undefined]
**data** | [**CartUpdateDataDto**](CartUpdateDataDto.md) | Cart update results | [optional] [default to undefined]
**errors** | [**Array&lt;BatchCreateProductsResponseDtoErrorsInner&gt;**](BatchCreateProductsResponseDtoErrorsInner.md) | Array of errors (only present when success is false or partial) | [optional] [default to undefined]
**meta** | **{ [key: string]: any; }** | Additional metadata | [optional] [default to undefined]

## Example

```typescript
import { UpdateCartResponseDto } from './api';

const instance: UpdateCartResponseDto = {
    success,
    data,
    errors,
    meta,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
