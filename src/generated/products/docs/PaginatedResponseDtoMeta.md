# PaginatedResponseDtoMeta

Pagination metadata

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**page** | **number** |  | [optional] [default to undefined]
**limit** | **number** |  | [optional] [default to undefined]
**total** | **number** |  | [optional] [default to undefined]
**totalPages** | **number** |  | [optional] [default to undefined]
**hasNext** | **boolean** |  | [optional] [default to undefined]
**hasPrev** | **boolean** |  | [optional] [default to undefined]
**timestamp** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { PaginatedResponseDtoMeta } from './api';

const instance: PaginatedResponseDtoMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    timestamp,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
