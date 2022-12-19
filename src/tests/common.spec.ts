
import axios from 'axios';

const url = `http://localhost:3000/graphql`

describe('Simple tests', () => {

  beforeEach(() => {
  });

  describe('Get users', () => {
    it('should return array of all users', async () => {
      const query = `
        query {
          users {
            id
          }
        }
      `
      const res = await axios({
        url,
        method: 'POST',
        data: { query }
      });

      const expected = [
        { "id": 1 },
        { "id": 2 },
        { "id": 3 },
      ]

      expect(res.data.data.users).toEqual(
        expect.arrayContaining(expected),
      );;
    });

    it('should return user with id 10', async () => {
      const query = `
        query GetOneUser($id: Int) {
          users(
            where: {
              id: { eq: $id }
            }
          ) {
            id
          }
        }
      `
      
      const variables = {
        id: 10
      }

      const res = await axios({
        url,
        method: 'POST',
        data: { query, variables }
      });

      const expected = [
        { "id": 10 },
      ]

      expect(res.data.data.users).toEqual(
        expect.arrayContaining(expected),
      );;
    });
  });
});