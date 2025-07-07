import Dexie, { type Table } from 'dexie';
import type { ProcessedItem } from './types';

export class MultimediaSageDB extends Dexie {
  items!: Table<ProcessedItem, string>; 

  constructor() {
    super('multimediaSageDB');
    this.version(1).stores({
      items: 'id, createdAt', // Primary key and index for sorting
    });
  }
}

export const db = new MultimediaSageDB();
