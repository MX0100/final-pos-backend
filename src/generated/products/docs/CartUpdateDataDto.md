# CartUpdateDataDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cart** | [**Cart**](Cart.md) | Updated cart entity with current items | [default to undefined]
**blocked** | **boolean** | Whether the cart is blocked due to unavailable items | [default to undefined]
**blockReason** | **string** | Reason for blocking if blocked is true | [optional] [default to undefined]

## Example

```typescript
import { CartUpdateDataDto } from './api';

const instance: CartUpdateDataDto = {
    cart,
    blocked,
    blockReason,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
