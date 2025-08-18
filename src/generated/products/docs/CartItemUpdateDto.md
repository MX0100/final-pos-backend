# CartItemUpdateDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**productId** | **string** | Product ID | [default to undefined]
**quantity** | **number** | Quantity to set. Set to 0 to remove item, greater than 0 to add or update quantity | [default to undefined]

## Example

```typescript
import { CartItemUpdateDto } from './api';

const instance: CartItemUpdateDto = {
    productId,
    quantity,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
