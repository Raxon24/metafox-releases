/**
 * @type: saga
 * name: updatedPages
 */

import {
  LocalAction,
  viewItem,
  PAGINATION_CLEAR,
  getGlobalContext
} from '@metafox/framework';
import { takeEvery } from 'redux-saga/effects';

function* updatedPages({ payload: { id } }: LocalAction<{ id: string }>) {
  const { dispatch } = yield* getGlobalContext();

  yield* viewItem('page', 'page', id);

  dispatch({
    type: PAGINATION_CLEAR,
    payload: { pagingId: '/user/shortcut' }
  });
}

const sagas = [takeEvery('@updatedItem/page', updatedPages)];

export default sagas;
