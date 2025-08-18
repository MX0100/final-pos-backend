# ReservationItemDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**productId** | **string** | Product ID | [default to undefined]
**qtyDelta** | **number** | Quantity delta (positive&#x3D;reserve, negative&#x3D;release) | [default to undefined]
**opId** | **string** | Operation ID for tracking | [optional] [default to undefined]

## Example

```typescript
import { ReservationItemDto } from './api';

const instance: ReservationItemDto = {
    productId,
    qtyDelta,
    opId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
