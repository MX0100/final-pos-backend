# BatchCreateProductsResponseDtoData

Batch product creation results

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**successful** | **Array&lt;string&gt;** | Successfully created products | [optional] [default to undefined]
**failed** | [**Array&lt;BatchCreateProductsResponseDtoDataFailedInner&gt;**](BatchCreateProductsResponseDtoDataFailedInner.md) | Failed products with error details | [optional] [default to undefined]

## Example

```typescript
import { BatchCreateProductsResponseDtoData } from './api';

const instance: BatchCreateProductsResponseDtoData = {
    successful,
    failed,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
