# ReservationResultDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**productId** | **string** |  | [default to undefined]
**productName** | **string** |  | [default to undefined]
**qtyDelta** | **number** |  | [default to undefined]
**opId** | **string** |  | [default to undefined]
**status** | **string** | success | insufficient_stock | not_found | [default to undefined]
**availableStock** | **number** |  | [default to undefined]
**error** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { ReservationResultDto } from './api';

const instance: ReservationResultDto = {
    productId,
    productName,
    qtyDelta,
    opId,
    status,
    availableStock,
    error,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
