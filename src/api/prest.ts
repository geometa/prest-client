import { stringify } from 'querystring';

/**
 * Options for creating a Prest API client.
 *
 * @export
 * @interface PrestApiClientOptions
 */
export interface PrestApiClientOptions {
  /**
   * The base URL of the Prest API endpoint.
   */
  base_url: string;

  /**
   * The name of the authHeader.
   */
  authHeader: string;
}

/**
 * A class that represents a chained query for interacting with a Prest API endpoint.
 *
 * This class allows you to build up a query by chaining various filter, function, and order methods.
 * Once the query is complete, you can call the `execute` method to execute the query and retrieve the results.
 */
class ChainedQuery {
  private client: PrestApiClient;
  private baseUrl: string;
  private reqType: 'get' | 'post' | 'put' | 'delete' | 'export';
  private body: any;
  private rendererArg: 'json' | 'xml' = 'json';
  private sqlFunctions: string[] = [];
  private chainedOperations: string[];

  /**
   * Creates a new ChainedQuery instance.
   *
   * @param client - The Prest API client to use for making the request.
   * @param baseUrl - The base URL of the Prest API endpoint.
   * @param reqType - The HTTP request type ('get', 'post', 'put', or 'delete').
   * @param body - The data to send in the request body (for POST and PUT requests).
   */
  constructor(
    client: PrestApiClient,
    baseUrl: string,
    reqType: 'get' | 'post' | 'put' | 'delete' | 'export',
    body: any,
  ) {
    this.client = client;
    this.baseUrl = baseUrl;
    this.reqType = reqType;
    this.body = body;
    this.chainedOperations = [];
  }

  /**
   * Adds a page filter to the query, specifying which page of results to retrieve.
   *
   * This is useful for paginating large datasets.
   * Prest API uses a zero-based indexing for pages, where the first page is `_page=0`.
   *
   * @param pageNumber - The page number (zero-based) to retrieve.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the second page (10 items per page) of products
   * const query = client.table('products').list()
   *   .page(1)
   *   .execute();
   * ```
   */
  page(pageNumber: number): ChainedQuery {
    this.chainedOperations.push(stringify({ _page: pageNumber }));
    return this;
  }

  /**
   * Adds a page size filter to the query, specifying the number of items to retrieve per page.
   *
   * This is useful in conjunction with `page` to control how many results are returned at a time.
   *
   * @param pageSize - The number of items per page.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the first page (10 items per page) of customers
   * const query = client.table('customers').list()
   *   .pageSize(10)
   *   .execute();
   * ```
   */
  pageSize(pageSize: number): ChainedQuery {
    this.chainedOperations.push(stringify({ _page_size: pageSize }));
    return this;
  }

  /**
   * Adds a select filter to the query, specifying which fields to retrieve from the results.
   *
   * By default, all fields are returned. Use this method to limit the response to only the fields you need.
   *
   * @param ...fields - A list of field names to select.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve only the 'id', 'name', and 'price' fields from products
   * const query = client.table('products').list()
   *   .select('id, name, price')
   *   .execute();
   * ```
   */
  select(fields: string): ChainedQuery {
    this.chainedOperations.push(stringify({ _select: fields}));
    return this;
  }

  /**
   * Adds a count filter to the query, which returns the total number of rows in the table.
   *
   * This is useful for getting the overall count of items without retrieving all results. You can optionally specify
   * a field to count. By default, all fields (`*`) are counted.
   *
   * @param field - The field to count (optional, defaults to '*').
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Count the total number of products
   * const query = client.table('products')
   *   .count()
   *   .execute();
   *
   * // Count the number of active users
   * const query = client.table('users')
   *   .count('is_active')
   *   .execute();
   * ```
   */
  count(field?: string): ChainedQuery {
    const fieldValue = field ? field : '*';
    this.chainedOperations.push(stringify({ _count: fieldValue }));
    return this;
  }

  /**
   * Adds a count_first filter to the query, which returns either the first row or the total count.
   *
   * This is useful for checking if there are any results or retrieving the first row quickly.
   *
   * @param countFirst - A boolean value indicating whether to return the first row (true) or the total count (false).
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Check if there are any active orders
   * const query = client.table('orders')
   *   .countFirst(true)
   *   .execute();
   *
   * // Retrieve the first product
   * const query = client.table('products')
   *   .countFirst()
   *   .execute();
   * ```
   */
  countFirst(countFirst: boolean = true): ChainedQuery {
    this.chainedOperations.push(stringify({ _count_first: countFirst }));
    return this;
  }

  /**
   * Sets the output renderer for the query results ('json' or 'xml').
   *
   * By default, the response is formatted as JSON. Use this method to specify XML instead.
   *
   * @param rendererArg - The desired output renderer ('json' or 'xml').
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products in XML format
   * const query = client.table('products')
   *   .renderer('xml')
   *   .execute();
   * ```
   */
  renderer(rendererArg: 'json' | 'xml'): ChainedQuery {
    this.chainedOperations.push(stringify({ _renderer: rendererArg }));
    this.rendererArg = rendererArg;
    return this;
  }

  /**
   * Adds a distinct filter to the query, which removes duplicate rows from the result set.
   *
   * This is useful when you want to retrieve unique values from a column or combination of columns.
   *
   * @param distinct - A boolean value indicating whether to apply distinct filtering (true) or not (false).
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve distinct product categories
   * const query = client.table('products').list()
   *   .distinct(true)
   *   .execute();
   * ```
   */
  distinct(distinct: boolean = true): ChainedQuery {
    this.chainedOperations.push(stringify({ _distinct: distinct }));
    return this;
  }

  /**
   * Adds an order filter to the query, specifying the order in which the results should be returned.
   *
   * Use a minus sign (-) prefix to indicate descending order for a field.
   *
   * @param ...fields - A list of field names to order by. Prefix field names with '-' for descending order.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products ordered by price in descending order
   * const query = client.table('products').list()
   *   .order('-price')
   *   .execute();
   *
   * // Retrieve products ordered by price in ascending order, then by name in descending order
   * const query = client.table('products').list()
   *   .order('price', '-name')
   *   .execute();
   * ```
   */
  order(...fields: string[]): ChainedQuery {
    const orderFields = fields.map((field) =>
      field.startsWith('-') ? field : `${field}`,
    );
    this.chainedOperations.push(stringify({ _order: orderFields.join(',') }));
    return this;
  }

  /**
   * Adds a group by filter to the query, grouping the results based on the specified fields.
   *
   * This is useful when you want to perform aggregate functions (such as SUM, AVG, etc.) on grouped data.
   *
   * @param ...fields - A list of field names to group by.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve total sales amount grouped by product category
   * const query = client.table('sales').list()
   *   .groupBy('product_category')
   *   .sum('sales_amount')
   *   .execute();
   * ```
   */
  groupBy(...fields: string[]): ChainedQuery {
    this.chainedOperations.push(stringify({ _groupby: fields.join(',') }));
    return this;
  }

  /**
   * Adds an equal filter to the query, specifying that a field must be equal to a certain value.
   *
   * @param field - The field to filter by.
   * @param value - The value that the field must be equal to.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with the 'category' field equal to 'electronics'
   * const query = client.table('products').list()
   *   .eq('category', 'electronics')
   *   .execute();
   * ```
   */
  eq(field: string, value: any): ChainedQuery {
    this.chainedOperations.push(`${field}=${encodeURIComponent(value)}`);
    return this;
  }

 /**
   * Adds a greater than filter to the query, specifying that a field must be greater than a certain value.
   *
   * @param field - The field to filter by.
   * @param value - The value that the field must be greater than.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with price greater than 100
   * const query = client.table('products').list()
   *   .gt('price', 100)
   *   .execute();
   * ```
   */
  gt(field: string, value: any): ChainedQuery {
    this.chainedOperations.push(`${field}=$gt.${encodeURIComponent(value)}`);
    return this;
  }
  
  /**
   * Adds a greater than or equal to filter to the query.
   *
   * @param field - The field to filter by.
   * @param value - The value that the field must be greater than or equal to.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with price greater than or equal to 100
   * const query = client.table('products').list()
   *   .gte('price', 100)
   *   .execute();
   * ```
   */
  gte(field: string, value: any): ChainedQuery {
    this.chainedOperations.push(`${field}=$gte.${encodeURIComponent(value)}`);
    return this;
  }

  /**
   * Adds a less than filter to the query.
   *
   * @param field - The field to filter by.
   * @param value - The value that the field must be less than.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with price less than 100
   * const query = client.table('products').list()
   *   .lt('price', 100)
   *   .execute();
   * ```
   */
  lt(field: string, value: any): ChainedQuery {
    this.chainedOperations.push(`${field}=$lt.${encodeURIComponent(value)}`);
    return this;
  }

  /**
   * Adds a less than or equal to filter to the query.
   *
   * @param field - The field to filter by.
   * @param value - The value that the field must be less than or equal to.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with price less than or equal to 100
   * const query = client.table('products').list()
   *   .lte('price', 100)
   *   .execute();
   * ```
   */
  lte(field: string, value: any): ChainedQuery {
    this.chainedOperations.push(`${field}=$lte.${encodeURIComponent(value)}`);
    return this;
  }

  /**
   * Adds a not equal filter to the query.
   *
   * @param field - The field to filter by.
   * @param value - The value that the field must not be equal to.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with status not equal to 'discontinued'
   * const query = client.table('products').list()
   *   .ne('status', 'discontinued')
   *   .execute();
   * ```
   */
  ne(field: string, value: any): ChainedQuery {
    this.chainedOperations.push(`${field}=$ne.${encodeURIComponent(value)}`);
    return this;
  }

  /**
   * Adds an IN filter to the query, specifying that a field must match any value in the provided array.
   *
   * @param field - The field to filter by.
   * @param values - Array of values that the field can match.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with category_id in [1, 2, 3]
   * const query = client.table('products').list()
   *   .in('category_id', [1, 2, 3])
   *   .execute();
   * ```
   */
  in(field: string, values: any[]): ChainedQuery {
    this.chainedOperations.push(`${field}=$in.${values.join(',')}`);
    return this;
  }

  /**
   * Adds a NOT IN filter to the query, specifying that a field must not match any value in the provided array.
   *
   * @param field - The field to filter by.
   * @param values - Array of values that the field must not match.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with category_id not in [1, 2, 3]
   * const query = client.table('products').list()
   *   .notIn('category_id', [1, 2, 3])
   *   .execute();
   * ```
   */
  notIn(field: string, values: any[]): ChainedQuery {
    this.chainedOperations.push(`${field}=$nin.${values.join(',')}`);
    return this;
  }

  /**
   * Adds a NULL filter to the query, specifying that a field must be NULL.
   *
   * @param field - The field to filter by.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with null description
   * const query = client.table('products').list()
   *   .null('description')
   *   .execute();
   * ```
   */
  null(field: string): ChainedQuery {
    this.chainedOperations.push(`${field}=$null`);
    return this;
  }

  /**
   * Adds a NOT NULL filter to the query, specifying that a field must not be NULL.
   *
   * @param field - The field to filter by.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with non-null description
   * const query = client.table('products').list()
   *   .notNull('description')
   *   .execute();
   * ```
   */
  notNull(field: string): ChainedQuery {
    this.chainedOperations.push(`${field}=$notnull`);
    return this;
  }

  /**
   * Adds a LIKE filter to the query for pattern matching (case-sensitive).
   *
   * @param field - The field to filter by.
   * @param value - The pattern to match (using SQL LIKE syntax).
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with names starting with 'Apple'
   * const query = client.table('products').list()
   *   .like('name', 'Apple%')
   *   .execute();
   * ```
   */
  like(field: string, value: string): ChainedQuery {
    this.chainedOperations.push(`${field}=$like.${encodeURIComponent(value)}`);
    return this;
  }

  /**
   * Adds an ILIKE filter to the query for case-insensitive pattern matching.
   *
   * @param field - The field to filter by.
   * @param value - The pattern to match (using SQL ILIKE syntax).
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with names containing 'phone' (case-insensitive)
   * const query = client.table('products').list()
   *   .ilike('name', '%phone%')
   *   .execute();
   * ```
   */
  ilike(field: string, value: string): ChainedQuery {
    this.chainedOperations.push(`${field}=$ilike.${encodeURIComponent(value)}`);
    return this;
  }

  /**
   * Adds a NOT LIKE filter to the query for pattern exclusion (case-sensitive).
   *
   * @param field - The field to filter by.
   * @param value - The pattern to exclude (using SQL LIKE syntax).
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve products with names not starting with 'Test'
   * const query = client.table('products').list()
   *   .notLike('name', 'Test%')
   *   .execute();
   * ```
   */
  notLike(field: string, value: string): ChainedQuery {
    this.chainedOperations.push(`${field}=$notlike.${encodeURIComponent(value)}`);
    return this;
  }

  /**
   * Adds a Sum function to the query, calculating the sum of values in the specified field.
   *
   * This is useful when you want to aggregate numerical values across grouped data.
   *
   * @param field - The field for which to calculate the sum.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the sum of category IDs grouped by category
   * const query = client.table('categories').list()
   *   .groupBy('category_id')
   *   .sum('category_id')
   *   .execute();
   * ```
   */
  sum(field: string): ChainedQuery {
    this.sqlFunctions.push(`sum:${field}`);
    return this;
  }

  /**
   * Adds an Avg function to the query, calculating the average of values in the specified field.
   *
   * This is useful when you want to find the average value of a numerical field across grouped data.
   *
   * @param field - The field for which to calculate the average.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the average of category IDs grouped by category
   * const query = client.table('categories').list()
   *   .groupBy('category_id')
   *   .avg('category_id')
   *   .execute();
   * ```
   */
  avg(field: string): ChainedQuery {
    this.sqlFunctions.push(`avg:${field}`);
    return this;
  }

  /**
   * Adds a Max function to the query, finding the maximum value in the specified field.
   *
   * This is useful when you want to find the maximum value of a field across grouped data.
   *
   * @param field - The field for which to find the maximum value.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the maximum category ID grouped by category
   * const query = client.table('categories').list()
   *   .groupBy('category_id')
   *   .max('category_id')
   *   .execute();
   * ```
   */
  max(field: string): ChainedQuery {
    this.sqlFunctions.push(`max:${field}`);
    return this;
  }

  /**
   * Adds a Min function to the query, finding the minimum value in the specified field.
   *
   * This is useful when you want to find the minimum value of a field across grouped data.
   *
   * @param field - The field for which to find the minimum value.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the minimum category ID grouped by category
   * const query = client.table('categories').list()
   *   .groupBy('category_id')
   *   .min('category_id')
   *   .execute();
   * ```
   */
  min(field: string): ChainedQuery {
    this.sqlFunctions.push(`min:${field}`);
    return this;
  }

  /**
   * Adds a StdDev function to the query, calculating the standard deviation of values in the specified field.
   *
   * This is useful when you want to analyze the variability of numerical data across grouped data.
   *
   * @param field - The field for which to calculate the standard deviation.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the standard deviation of category IDs grouped by category
   * const query = client.table('categories').list()
   *   .groupBy('category_id')
   *   .stdDev('category_id')
   *   .execute();
   * ```
   */
  stdDev(field: string): ChainedQuery {
    this.sqlFunctions.push(`stddev:${field}`);
    return this;
  }

  /**
   * Adds a Variance function to the query, calculating the variance of values in the specified field.
   *
   * This is useful when you want to measure the spread or dispersion of numerical data across grouped data.
   *
   * @param field - The field for which to calculate the variance.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve the variance of category IDs grouped by category
   * const query = client.table('categories').list()
   *   .groupBy('category_id')
   *   .variance('category_id')
   *   .execute();
   * ```
   */
  variance(field: string): ChainedQuery {
    this.sqlFunctions.push(`variance:${field}`);
    return this;
  }

  /**
   * Adds a having filter to the query, specifying a condition for aggregated values after grouping.
   *
   * This is useful when you want to filter grouped results based on aggregated values.
   *
   * @param groupFunc - The aggregation function to apply the condition to (e.g., 'sum', 'avg', 'min', 'max', etc.).
   * @param field - The field to which the condition applies.
   * @param condition - The condition operator (e.g., '$gt', '$lt', '$eq', etc.).
   * @param value - The value to compare against.
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Retrieve categories where the sum of category IDs is greater than 5
   * const query = client.table('categories').list()
   *   .groupBy('category_id')
   *   .sum('category_id')
   *   .having('sum', 'category_id', '$gt', 5)
   *   .execute();
   * ```
   */
  having(
    groupFunc: string,
    field: string,
    condition: string,
    value: any,
  ): ChainedQuery {
    const havingClause = `having:${groupFunc}:${field}:${condition}:${encodeURIComponent(value)}`;
    this.chainedOperations.push(havingClause);
    return this;
  }

  /**
   * Filters results based on a field being within a specific range.
   *
   * @param field The name of the field to filter on.
   * @param start (optional) The lower bound of the range (inclusive).
   * @param end (optional) The upper bound of the range (inclusive).
   * @returns A chained query object for further building the query.
   */
  filterRange(field: string, start?: any, end?: any): ChainedQuery {
    if (start === 0 || start) {
      this.chainedOperations.push(`${field}=$gte.${encodeURIComponent(start)}`);
    }
    if (end === 0 || end) {
      this.chainedOperations.push(`${field}=$lte.${encodeURIComponent(end)}`);
    }
    return this;
  }

  /**
   * Performs a join between tables.
   *
   * @param type The type of join to perform (e.g., 'inner', 'left', 'right').
   * @param table The name of the table to join with.
   * @param leftField The field name from the current table.
   * @param operator The comparison operator to use (e.g., '$eq', '$gt', '$lt').
   * @param rightField The field name from the joined table.
   * @returns A chained query object for further building the query.
   *
   * @example
   * ```typescript
   * // Perform an inner join between 'categories' and 'products' tables
   * const response = await client
   *   .table('categories')
   *   .list()
   *   .join(
   *     'inner',
   *     'products',
   *     'categories.category_id',
   *     '$eq',
   *     'products.category_id',
   *   )
   *   .execute();
   * ```
   */
  join(
    joinType: 'inner' | 'left' | 'right' | 'outer',
    jointable: string,
    localField: string,
    operator: string,
    foreignField: string,
  ): ChainedQuery {
    const joinClause = `_join=${joinType}:${jointable}:${localField}:${operator}:${foreignField}`;
    this.chainedOperations.push(joinClause);
    return this;
  }

  /**
   * Filters results based on a JSON field using a JSONB path expression.
   *
   * @param field The name of the JSON field to filter on.
   * @param path The JSONB path expression to use for filtering.
   * @param value The value to compare against the path in the JSON field.
   * @returns A chained query object for further building the query.
   *
   * @example
   * ```typescript
   * // Assuming a 'mock_json' table with a 'jsonb_data' field containing JSON data
   * const response = await client
   *   .table('mock_json')
   *   .list()
   *   .jsonbFilter('jsonb_data', 'tags', 1)
   *   .execute();
   * ```
   */
  jsonbFilter(field: string, jsonField: string, value: any): ChainedQuery {
    const filterClause = `${field}->>${jsonField}:jsonb=${encodeURIComponent(value)}`;
    this.chainedOperations.push(filterClause);
    return this;
  }

  /**
   * Adds a full-text search filter to the query using tsquery syntax.
   *
   * @param field - The field to perform the text search on.
   * @param query - The tsquery string representing the search query.
   * @param language - The language to tokenize the query in (optional).
   * @returns The ChainedQuery instance to allow for method chaining.
   *
   * @example
   * ```typescript
   * // Perform a full-text search for documents containing 'fat' and 'rat'
   * const query = client.table('documents').list()
   *   .textSearch('content', 'fat & rat')
   *   .execute();
   *
   * // Perform a full-text search in Portuguese language for documents containing 'gato' and 'cão'
   * const query = client.table('documents').list()
   *   .textSearch('content', 'gato & cão', 'portuguese')
   *   .execute();
   * ```
   */
  textSearch(field: string, query: string, language?: string): ChainedQuery {
    const tsQuery = `${field}${language ? '$' + language : ''}:tsquery=${encodeURIComponent(query)}`;
    this.chainedOperations.push(tsQuery);
    return this;
  }



  /**
   * Executes the chained query operations and returns the result.
   *
   * @returns A promise that resolves with the query result.
   */
  async execute(): Promise<any> {
    let chainedUrl = this.baseUrl;

    if (this.chainedOperations.length > 0) {
      chainedUrl += `?${this.chainedOperations[0]}`;

      for (let i = 1; i < this.chainedOperations.length; i++) {
        chainedUrl += `&${this.chainedOperations[i]}`;
      }
    }

    if (this.sqlFunctions.length > 0) {
      chainedUrl += `&_select=${this.sqlFunctions.join(',')}`;
    }

    try {
      console.log(chainedUrl);
      const httpClientMethod = this.client.getHttpClientMethod(this.reqType);
      const response = await httpClientMethod(chainedUrl, this.body);

      if (this.reqType === 'export'){
        return response.blob();
      }else{
        if (this.rendererArg === 'json') {
          return response.json();
        } else {
          return response.text();
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to make API request: ${error.message}`);
    }
  }
}

/**
 * A client for interacting with a Prest API.
 *
 * @export
 * @class PrestApiClient
 */
export class PrestApiClient {
  /**
   * The underlying HTTP client for making requests to the Prest API.
   */
  private client:
    | undefined
    | {
        get: (url: string) => Promise<Response>;
        export: (url: string, body: any) => Promise<Response>;
        post: (url: string, body: any) => Promise<Response>;
        put: (url: string, body: any) => Promise<Response>;
        delete: (url: string) => Promise<Response>;
      };

  /**
   * The options used to configure the client.
   */
  private options: PrestApiClientOptions;

  /**
   * Creates a new Prest API client with the provided options.
   *
   * @param options - The options for creating the client.
   */
  constructor(options: PrestApiClientOptions) {
    this.options = options;
    this.createClient();
  }

  /**
   * Creates the underlying HTTP client with the necessary authentication headers.
   */
  private async createClient() {
    try {
      const authHeader = this.options.authHeader;

      this.client = {
        get: async (url: string) => {
          const response = await fetch(url, {
            headers: {
              Authorization: authHeader,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }

          return response;
        },
        export: async (url: string, body: any) => {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/csv',  // 指定接受 CSV 格式
              Authorization: authHeader
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            throw new Error(`Failed to export data: ${response.statusText}`);
          }

          return response;  // 返回二进制数据
        },
        post: async (url: string, body: any) => {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            throw new Error(`Failed to insert data: ${response.statusText}`);
          }

          return response;
        },
        put: async (url: string, body: any) => {
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            throw new Error(`Failed to update data: ${response.statusText}`);
          }

          return response;
        },
        delete: async (url: string) => {
          const response = await fetch(url, {
            method: 'DELETE',
            headers: {
              Authorization: authHeader,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to delete data: ${response.statusText}`);
          }

          return response;
        },
      };
    } catch (error) {
      console.error('Error creating client:', error);
    }
  }

  /**
   * Returns the appropriate HTTP client method for making the API request.
   *
   * @param method - The HTTP method to use ('get', 'post', 'put', or 'delete').
   * @returns The corresponding HTTP client method.
   * @throws An error if the client is not initialized or the method is invalid.
   */
  getHttpClientMethod(method: 'get' | 'post' | 'put' | 'delete' | 'export') {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    switch (method) {
      case 'get':
        return this.client.get;
      case 'post':
        return this.client.post;
      case 'put':
        return this.client.put;
      case 'delete':
        return this.client.delete;
      case 'export':
        return this.client.export;
      default:
        throw new Error('Invalid HTTP method');
    }
  }

  /**
   * Returns an object for interacting with a specific table in the database.
   *
   * @param tableName - The name of the table.
   * @returns An object with methods for interacting with the table.
   */
  table(tableName: string | undefined): {
    /**
     * Retrieves the structure of the specified table.
     *
     * @returns A promise that resolves with the table structure.
     * @throws An error if fetching the table structure fails.
     *
     * @example
     * const response = await client.table('user').list();
     * // Queries the rows of the 'user' table. Public schema is used by default.
     * // Executes GET `/:schema/:table`.
     *
     * @example
     * const response = await client.table('private.user').list();
     * // Retrieves the rows of the 'user' table in the 'private' schema.
     * // Executes GET `/:schema/:table`.
     *
     * @example
     * const response = await client.table('public.').list();
     * // Retrieves a list of tables in the 'public' schema.
     * // Executes GET `/:schema`.
     * // Note: The dot at the end is to ignore the table name.
     */
    list: () => ChainedQuery;

    /**
     * Retrieves data from the specified table.
     *
     * @returns A promise that resolves with the data from the table.
     * @throws An error if fetching data from the table fails.
     *
     * @example
     * const response = await client.table('user').show();
     * // Retrieves data from the 'user' table.
     * // Executes GET `/show/:schema/:table`.
     */
    show: () => ChainedQuery;

    /**
     * Retrieves data from the specified table.
     *
     * @returns A promise that resolves with the data from the table.
     * @throws An error if fetching data from the table fails.
     *
     * @example
     * const response = await client.table('user').show();
     * // Retrieves data from the 'user' table.
     * // Executes GET `/show/:schema/:table`.
     */
    export: (data: any) => ChainedQuery;

    /**
     * Inserts data into the specified table.
     *
     * @param data - The data to insert, structured as a JavaScript object with properties matching the table's columns.
     * @returns A promise that resolves with the inserted data, including any generated IDs or timestamps.
     * @throws An error if inserting data fails.
     *
     * @example
     * const response = await client.table('user').insert({
     *   user_name: 'Ronaldo',
     *   description: 'Siuuu!!!',
     *   picture: '\\x',
     * });
     * // Inserts a new row into the 'user' table.
     * // Executes POST `/:schema/:table`.
     */
    insert: (data: any) => ChainedQuery;

    /**
     * Inserts multiple rows of data into the table in a single request.
     *
     * @param data An array of objects representing the data to insert.
     *                 Each object should have properties matching the table's columns.
     * @returns A promise resolving to an array containing the inserted rows.
     *         Each row will have the same structure as the provided data objects,
     *         including any server-generated values (e.g., auto-incrementing IDs).
     *
     * @example
     * ```typescript
     * const data = [
     *   {
     *     category_name: 'Category 1',
     *     description: 'Description 1',
     *     picture: '\\x',
     *   },
     *   {
     *     category_name: 'Category 2',
     *     description: 'Description 2',
     *     picture: '\\x',
     *   },
     * ];
     *
     * const response = await client
     *   .table('categories')
     *   .batchInsert(data)
     *   .execute();
     *
     * console.log(response);
     * // response will be an array of inserted objects with potentially added server-generated IDs
     * ```
     */
    batchInsert: (data: any[]) => ChainedQuery;

    /**
     * Updates data in the specified table based on the provided field and value.
     *
     * @param field - The field to filter by for updating.
     * @param value - The value of the field to filter by for updating.
     * @param data - The data to update, structured as a JavaScript object with properties matching the table's columns.
     * @returns A promise that resolves with the updated data.
     * @throws An error if updating data fails.
     *
     * @example
     * const response = await client.table('user').update(
     *   'user_id', // Field to filter by
     *   userIdToUpdate, // Value of the field to filter by
     *   {
     *     user_name: 'NewName',
     *     description: 'Updated description',
     *     picture: '\\x',
     *   }
     * );
     * // Updates data in the 'user' table where 'user_id' equals 'userIdToUpdate'.
     * // Executes PUT `/:schema/:table?field=value`.
     */
    update: (data: any) => ChainedQuery;

    /**
     * Deletes data from the specified table based on the provided field and value.
     *
     * @param field - The field to filter by for deletion.
     * @param value - The value of the field to filter by for deletion.
     * @returns A promise that resolves when the data is successfully deleted.
     * @throws An error if deleting data fails.
     *
     * @example
     * const response = await client.table('user').delete(
     *   'user_id', // Field to filter by
     *   userIdToDelete // Value of the field to filter by
     * );
     * // Deletes data from the 'user' table where 'user_id' equals 'userIdToDelete'.
     * // Executes DELETE `/:schema/:table?field=value`.
     */
    delete: () => ChainedQuery;
  } {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (!tableName) {
      throw new Error('table name is required');
    }

    let schemaName: string = 'public';
    if (tableName.includes('.')) {
      const parts = tableName.split('.');
      schemaName = parts[0] || schemaName;
      tableName = parts[1];
    }

    return {
      list: (): ChainedQuery => {
        const baseUrl = `${this.base_url}/${schemaName}/${tableName}`;
        return new ChainedQuery(this, baseUrl, 'get', null);
      },
      show: (): ChainedQuery => {
        const baseUrl = `${this.base_url}/show/${schemaName}/${tableName}`;
        return new ChainedQuery(this, baseUrl, 'get', null);
      },
      export: (data: any): ChainedQuery => {
        const baseUrl = `${this.base_url}/export/${schemaName}/${tableName}`;
        return new ChainedQuery(this, baseUrl, 'export', data);
      },
      insert: (data: any): ChainedQuery => {
        const baseUrl = `${this.base_url}/${schemaName}/${tableName}`;
        return new ChainedQuery(this, baseUrl, 'post', data);
      },
      batchInsert: (data: any): ChainedQuery => {
        const baseUrl = `${this.base_url}/batch/${schemaName}/${tableName}`;
        return new ChainedQuery(this, baseUrl, 'post', data);
      },
      update: (data: any): ChainedQuery => {
        const baseUrl = `${this.base_url}/${schemaName}/${tableName}`;
        return new ChainedQuery(this, baseUrl, 'put', data);
      },
      delete: (): ChainedQuery => {
        const baseUrl = `${this.base_url}/${schemaName}/${tableName}`;
        return new ChainedQuery(this, baseUrl, 'delete', null);
      },
    };
  }

  /**
   * Returns an object for interacting with a specific table in the database.
   *
   * @param Script - The name of the table.
   * @returns An object with methods for interacting with the table.
   */
  query(sPath: string | undefined): {
    /**
     * Retrieves the structure of the specified table.
     *
     * @returns A promise that resolves with the table structure.
     * @throws An error if fetching the table structure fails.
     *
     * @example
     * const response = await client.query('private.user').list();
     * // Retrieves the rows of the 'user' sql in the 'private' path.
     * // Executes GET `/_queries/:path/:sql`.
     */
    list: () => ChainedQuery;
    /**
     * Retrieves the structure of the specified table.
     *
     * @returns A promise that resolves with the table structure.
     * @throws An error if fetching the table structure fails.
     *
     * @example
     * const response = await client.query('private.user').list();
     * // Retrieves the rows of the 'user' sql in the 'private' path.
     * // Executes GET `/_queries/:path/:sql`.
     */
    export: (data: any) => ChainedQuery;
  } {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (!sPath) {
      throw new Error('script name is required');
    }

    let path: string = '';
    if (sPath.includes('.')) {
      const parts = sPath.split('.');
      path = parts[0] || sPath;
      sPath = parts[1];
    }

    return {
      list: (): ChainedQuery => {
        const baseUrl = `${this.base_url}/_queries/${path}/${sPath}`;
        return new ChainedQuery(this, baseUrl, 'get', null);
      },
      export: (data: any): ChainedQuery => {
        const baseUrl = `${this.base_url}/_queries/export/${path}/${sPath}`;
        return new ChainedQuery(this, baseUrl, 'export', data);
      }
    };
  }

  /**
   * Gets the base URL of the Prest API endpoint to which the client is connected.
   */
  get base_url(): string {
    return this.options.base_url;
  }
}

