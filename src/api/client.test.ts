import { PrestApiClient, type PrestApiClientOptions } from './client';
import envs from '../env.config';

jest.mock('node-fetch');

describe('PrestApiClient', () => {
  let client: PrestApiClient;
  const id: number = Math.floor(Math.random() * 1000);

  beforeEach(() => {
    const options: PrestApiClientOptions = {
      base_url: envs.BASE_URL,
      user_name: envs.USER_NAME,
      password: envs.USER_PASSWORD,
      database: envs.DATABASE_NAME,
    };
    client = new PrestApiClient(options);
  });

  it('should fetch categories successfully', async () => {
    const response = await client.Table('categories').List().execute();
    console.log(response);
    expect(Array.isArray(response)).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);
  });

  it('should fetch categories from public schema successfully', async () => {
    const response = await client.Table('public.categories').List().execute();
    console.log(response);
    expect(Array.isArray(response)).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);
  });

  it('should retrieve a list of tables in a schema', async () => {
    const response = await client.Table('public.').List().execute();
    console.log(response);
    expect(Array.isArray(response)).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);
  });

  it('should fetch information about a table successfully using Show method', async () => {
    const response = await client.Table('categories').Show().execute();
    console.log(response);
    expect(Array.isArray(response)).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);

    for (const column of response) {
      expect(column).toHaveProperty('position');
      expect(column).toHaveProperty('data_type');
      expect(column).toHaveProperty('max_length');
      expect(column).toHaveProperty('table_name');
      expect(column).toHaveProperty('column_name');
      expect(column).toHaveProperty('is_nullable');
      expect(column).toHaveProperty('is_generated');
      expect(column).toHaveProperty('is_updatable');
      expect(column).toHaveProperty('table_schema');
      expect(column).toHaveProperty('default_value');

      expect(typeof column.position).toBe('number');
      expect(typeof column.data_type).toBe('string');
      expect(typeof column.table_name).toBe('string');
      expect(typeof column.column_name).toBe('string');
      expect(typeof column.is_nullable).toBe('string');
      expect(typeof column.is_generated).toBe('string');
      expect(typeof column.is_updatable).toBe('string');
      expect(typeof column.table_schema).toBe('string');
    }
  });

  it('should insert data into the table successfully', async () => {
    const data = {
      category_id: id,
      category_name: 'Footballer',
      description: 'Siuuu!!!',
      picture: '\\x',
    };

    const response = await client.Table('categories').Insert(data);

    expect(response).toHaveProperty('category_id');
    expect(typeof response.category_id).toBe('number');
    expect(response).toHaveProperty('category_name');
    expect(response.category_name).toBe(data.category_name);
    expect(response).toHaveProperty('description');
    expect(response.description).toBe(data.description);
  });

  it('should update data in the table successfully', async () => {
    const categoryIdToUpdate = id;
    const dataToUpdate = {
      category_name: 'Footballer',
      description: 'Que mira bobo? Que mira bobo?',
      picture: '\\x',
    };

    const response = await client
      .Table('categories')
      .Update('category_id', categoryIdToUpdate, dataToUpdate);

    expect(response).toEqual({ rows_affected: 1 });
  });

  it('should delete data from the table successfully', async () => {
    const categoryIdToDelete = id;

    const response = await client
      .Table('categories')
      .Delete('category_id', categoryIdToDelete);

    expect(response).toEqual({ rows_affected: 1 });
  });
});
