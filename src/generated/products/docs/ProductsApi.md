# ProductsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**productsControllerAdjustStockV1**](#productscontrolleradjuststockv1) | **POST** /api/v1/products/{id}/adjust-stock/{delta} | Adjust single product stock (Cart quantity adjustment)|
|[**productsControllerBatchCreateV1**](#productscontrollerbatchcreatev1) | **POST** /api/v1/products/batch | Create multiple products in batch|
|[**productsControllerBatchReservationV1**](#productscontrollerbatchreservationv1) | **POST** /api/v1/products/reservations/batch | Batch stock reservation (Cart operations)|
|[**productsControllerCreateV1**](#productscontrollercreatev1) | **POST** /api/v1/products | Create a single product|
|[**productsControllerFindAllV1**](#productscontrollerfindallv1) | **GET** /api/v1/products | List products with pagination and filtering|
|[**productsControllerFindOneV1**](#productscontrollerfindonev1) | **GET** /api/v1/products/{identifier} | Get product by id or name|
|[**productsControllerGetCategoriesV1**](#productscontrollergetcategoriesv1) | **GET** /api/v1/products/categories | Get all product categories|
|[**productsControllerRemoveV1**](#productscontrollerremovev1) | **DELETE** /api/v1/products/{id} | Delete product by id|
|[**productsControllerUpdateV1**](#productscontrollerupdatev1) | **PUT** /api/v1/products/{id} | Update product by id|

# **productsControllerAdjustStockV1**
> SingleResourceResponseDto productsControllerAdjustStockV1()

Adjust stock quantity for a single product. Use positive values to increase, negative to decrease. This is a relative change operation.

### Example

```typescript
import {
    ProductsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let id: string; // (default to undefined)
let delta: string; // (default to undefined)

const { status, data } = await apiInstance.productsControllerAdjustStockV1(
    id,
    delta
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|
| **delta** | [**string**] |  | defaults to undefined|


### Return type

**SingleResourceResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Stock adjusted successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerBatchCreateV1**
> BatchCreateProductsResponseDto productsControllerBatchCreateV1(batchCreateProductsDto)

Create multiple products at once with partial success support.

### Example

```typescript
import {
    ProductsApi,
    Configuration,
    BatchCreateProductsDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let batchCreateProductsDto: BatchCreateProductsDto; //

const { status, data } = await apiInstance.productsControllerBatchCreateV1(
    batchCreateProductsDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **batchCreateProductsDto** | **BatchCreateProductsDto**|  | |


### Return type

**BatchCreateProductsResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Batch creation completed (check results for individual success/failure) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerBatchReservationV1**
> BatchReservationResponseDto productsControllerBatchReservationV1(batchReservationRequestDto)

Reserve/adjust stock for multiple products in cart operations.  Use cases: 1. Add multiple products to cart 2. Modify existing cart items  Modes: - All-or-nothing: All reservations succeed or fail together - Partial acceptance: Some reservations may fail while others succeed

### Example

```typescript
import {
    ProductsApi,
    Configuration,
    BatchReservationRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let batchReservationRequestDto: BatchReservationRequestDto; //

const { status, data } = await apiInstance.productsControllerBatchReservationV1(
    batchReservationRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **batchReservationRequestDto** | **BatchReservationRequestDto**|  | |


### Return type

**BatchReservationResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Batch stock reservation completed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerCreateV1**
> SingleResourceResponseDto productsControllerCreateV1(createProductDto)

Create a single product with validation and error handling

### Example

```typescript
import {
    ProductsApi,
    Configuration,
    CreateProductDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let createProductDto: CreateProductDto; //

const { status, data } = await apiInstance.productsControllerCreateV1(
    createProductDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createProductDto** | **CreateProductDto**|  | |


### Return type

**SingleResourceResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Product created successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerFindAllV1**
> PaginatedResponseDto productsControllerFindAllV1()

Get a paginated list of products with optional category filtering

### Example

```typescript
import {
    ProductsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let category: string; //Filter by product category (optional) (default to undefined)
let page: number; //Page number (starts from 1) (optional) (default to 1)
let limit: number; //Number of items per page (max 100) (optional) (default to 10)

const { status, data } = await apiInstance.productsControllerFindAllV1(
    category,
    page,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **category** | [**string**] | Filter by product category | (optional) defaults to undefined|
| **page** | [**number**] | Page number (starts from 1) | (optional) defaults to 1|
| **limit** | [**number**] | Number of items per page (max 100) | (optional) defaults to 10|


### Return type

**PaginatedResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Products retrieved successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerFindOneV1**
> SingleResourceResponseDto productsControllerFindOneV1()

Get a product by its ID or name. The system will first try to find by ID, then by name if not found.

### Example

```typescript
import {
    ProductsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let identifier: string; // (default to undefined)

const { status, data } = await apiInstance.productsControllerFindOneV1(
    identifier
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **identifier** | [**string**] |  | defaults to undefined|


### Return type

**SingleResourceResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Product retrieved successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerGetCategoriesV1**
> SimpleSuccessResponseDto productsControllerGetCategoriesV1()

Get a list of all unique product categories

### Example

```typescript
import {
    ProductsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

const { status, data } = await apiInstance.productsControllerGetCategoriesV1();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SimpleSuccessResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Categories retrieved successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerRemoveV1**
> DeleteResponseDto productsControllerRemoveV1()

Delete product and clean up any cart references. Returns 404 if product not found.

### Example

```typescript
import {
    ProductsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.productsControllerRemoveV1(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**DeleteResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Product deleted successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **productsControllerUpdateV1**
> SingleResourceResponseDto productsControllerUpdateV1(updateProductDto)

Update product fields. All provided fields will be updated.

### Example

```typescript
import {
    ProductsApi,
    Configuration,
    UpdateProductDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ProductsApi(configuration);

let id: string; // (default to undefined)
let updateProductDto: UpdateProductDto; //

const { status, data } = await apiInstance.productsControllerUpdateV1(
    id,
    updateProductDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateProductDto** | **UpdateProductDto**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

**SingleResourceResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Product updated successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

