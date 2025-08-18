# Cart


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [default to undefined]
**items** | [**Array&lt;CartItem&gt;**](CartItem.md) |  | [default to undefined]
**createdAt** | **string** |  | [default to undefined]
**updatedAt** | **string** |  | [default to undefined]
**status** | **string** | Cart status | [default to StatusEnum_Active]
**expiresAt** | **object** | Cart expiry time (updatedAt + 15 minutes) | [optional] [default to undefined]

## Example

```typescript
import { Cart } from './api';

const instance: Cart = {
    id,
    items,
    createdAt,
    updatedAt,
    status,
    expiresAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
