# CartsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**cartsControllerAddItemsToCartV1**](#cartscontrolleradditemstocartv1) | **POST** /api/v1/carts/{cartId}/items | Add items to cart (incremental)|
|[**cartsControllerCreateCartV1**](#cartscontrollercreatecartv1) | **POST** /api/v1/carts | Create a new cart|
|[**cartsControllerDeleteCartV1**](#cartscontrollerdeletecartv1) | **DELETE** /api/v1/carts/{cartId} | Delete cart|
|[**cartsControllerGetCartV1**](#cartscontrollergetcartv1) | **GET** /api/v1/carts/{cartId} | Get cart by ID|
|[**cartsControllerUpdateCartItemsV1**](#cartscontrollerupdatecartitemsv1) | **PUT** /api/v1/carts/{cartId}/items | Update cart items (overwrite)|
|[**cartsControllerUpdateItemQuantityV1**](#cartscontrollerupdateitemquantityv1) | **PATCH** /api/v1/carts/{cartId}/items/{productId} | Update item quantity|

# **cartsControllerAddItemsToCartV1**
> UpdateCartResponseDto cartsControllerAddItemsToCartV1(updateCartItemDto)

Add items to cart. If item already exists, quantity will be added to existing quantity.

### Example

```typescript
import {
    CartsApi,
    Configuration,
    UpdateCartItemDto
} from './api';

const configuration = new Configuration();
const apiInstance = new CartsApi(configuration);

let cartId: string; // (default to undefined)
let updateCartItemDto: UpdateCartItemDto; //

const { status, data } = await apiInstance.cartsControllerAddItemsToCartV1(
    cartId,
    updateCartItemDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateCartItemDto** | **UpdateCartItemDto**|  | |
| **cartId** | [**string**] |  | defaults to undefined|


### Return type

**UpdateCartResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Items added to cart successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cartsControllerCreateCartV1**
> UpdateCartResponseDto cartsControllerCreateCartV1()

Create a new shopping cart with default expiry time

### Example

```typescript
import {
    CartsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CartsApi(configuration);

const { status, data } = await apiInstance.cartsControllerCreateCartV1();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**UpdateCartResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Cart created successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cartsControllerDeleteCartV1**
> DeleteResponseDto cartsControllerDeleteCartV1()

Delete cart and release all reserved stock

### Example

```typescript
import {
    CartsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CartsApi(configuration);

let cartId: string; // (default to undefined)

const { status, data } = await apiInstance.cartsControllerDeleteCartV1(
    cartId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **cartId** | [**string**] |  | defaults to undefined|


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
|**200** | Cart deleted successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cartsControllerGetCartV1**
> UpdateCartResponseDto cartsControllerGetCartV1()

Get cart details including items and status

### Example

```typescript
import {
    CartsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CartsApi(configuration);

let cartId: string; // (default to undefined)

const { status, data } = await apiInstance.cartsControllerGetCartV1(
    cartId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **cartId** | [**string**] |  | defaults to undefined|


### Return type

**UpdateCartResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Cart retrieved successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cartsControllerUpdateCartItemsV1**
> UpdateCartResponseDto cartsControllerUpdateCartItemsV1(updateCartItemDto)

Set cart items to exact quantities. This will overwrite existing cart contents.

### Example

```typescript
import {
    CartsApi,
    Configuration,
    UpdateCartItemDto
} from './api';

const configuration = new Configuration();
const apiInstance = new CartsApi(configuration);

let cartId: string; // (default to undefined)
let updateCartItemDto: UpdateCartItemDto; //

const { status, data } = await apiInstance.cartsControllerUpdateCartItemsV1(
    cartId,
    updateCartItemDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateCartItemDto** | **UpdateCartItemDto**|  | |
| **cartId** | [**string**] |  | defaults to undefined|


### Return type

**UpdateCartResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Cart items updated successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cartsControllerUpdateItemQuantityV1**
> UpdateCartResponseDto cartsControllerUpdateItemQuantityV1(updateQuantityDto)

Update quantity of a specific item in cart

### Example

```typescript
import {
    CartsApi,
    Configuration,
    UpdateQuantityDto
} from './api';

const configuration = new Configuration();
const apiInstance = new CartsApi(configuration);

let cartId: string; // (default to undefined)
let productId: string; // (default to undefined)
let updateQuantityDto: UpdateQuantityDto; //

const { status, data } = await apiInstance.cartsControllerUpdateItemQuantityV1(
    cartId,
    productId,
    updateQuantityDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateQuantityDto** | **UpdateQuantityDto**|  | |
| **cartId** | [**string**] |  | defaults to undefined|
| **productId** | [**string**] |  | defaults to undefined|


### Return type

**UpdateCartResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Item quantity updated successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

