/**
 * ------------------------------------------------------------------
 * Views Service
 * ------------------------------------------------------------------
 * Service for managing saved filter views in the Email feature.
 * Uses localStorage for persistence. Provides CRUD operations
 * and a generic filter-applicator for datasets.
 *
 * Main functions:
 * - getAllViews()       : Retrieve all saved views
 * - getViewById()       : Get a single view by ID
 * - createView()        : Create a new saved view
 * - updateView()        : Update an existing view's name or filters
 * - deleteView()        : Remove a saved view
 * - applyViewFilters()  : Apply view filters to a generic dataset
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── Types ──
import { SavedView, FilterCard } from '../../filter/components/modal/FilterModal/types';

// ─── Constants ──────────────────────────────────────────────────────────
const VIEWS_STORAGE_KEY = 'email_filter_views';

// ─── Class ──────────────────────────────────────────────────────────────
export class ViewsService {
  /**
   * Get all saved views
   */
  static async getAllViews(): Promise<SavedView[]> {
    try {
      const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('[ViewsService] Failed to load views:', error);
      return [];
    }
  }

  /**
   * Get a single view by ID
   */
  static async getViewById(id: string): Promise<SavedView | null> {
    try {
      const views = await this.getAllViews();
      return views.find((v) => v.id === id) || null;
    } catch (error) {
      console.error('[ViewsService] Failed to get view:', error);
      return null;
    }
  }

  /**
   * Create a new view
   */
  static async createView(name: string, filters: FilterCard[]): Promise<SavedView> {
    try {
      const views = await this.getAllViews();
      const newView: SavedView = {
        id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        filters,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      views.push(newView);
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views));

      return newView;
    } catch (error) {
      console.error('[ViewsService] Failed to create view:', error);
      throw error;
    }
  }

  /**
   * Update an existing view
   */
  static async updateView(
    id: string,
    updates: { name?: string; filters?: FilterCard[] },
  ): Promise<SavedView | null> {
    try {
      const views = await this.getAllViews();
      const index = views.findIndex((v) => v.id === id);

      if (index === -1) {
        console.error('[ViewsService] View not found:', id);
        return null;
      }

      views[index] = {
        ...views[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views));
      return views[index];
    } catch (error) {
      console.error('[ViewsService] Failed to update view:', error);
      return null;
    }
  }

  /**
   * Delete a view
   */
  static async deleteView(id: string): Promise<boolean> {
    try {
      const views = await this.getAllViews();
      const filtered = views.filter((v) => v.id !== id);

      if (filtered.length === views.length) {
        console.error('[ViewsService] View not found:', id);
        return false;
      }

      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('[ViewsService] Failed to delete view:', error);
      return false;
    }
  }

  /**
   * Apply filters from a view to a dataset
   */
  static applyViewFilters<T extends Record<string, any>>(data: T[], filters: FilterCard[]): T[] {
    return data.filter((item) => {
      return filters.every((filter) => {
        const fieldValue = item[filter.field];
        const filterValue = filter.value;

        // Handle null/undefined checks
        if (filter.operator === 'isNull') {
          return fieldValue === null || fieldValue === undefined;
        }
        if (filter.operator === 'isNotNull') {
          return fieldValue !== null && fieldValue !== undefined;
        }

        // If field is null/undefined and we're not checking for null, fail the filter
        if (fieldValue === null || fieldValue === undefined) {
          return false;
        }

        // String operations
        if (typeof fieldValue === 'string') {
          const strValue = fieldValue.toLowerCase();
          const searchValue = filterValue.toLowerCase();

          switch (filter.operator) {
            case 'equals':
              return strValue === searchValue;
            case 'notEquals':
              return strValue !== searchValue;
            case 'contains':
              return strValue.includes(searchValue);
            case 'notContains':
              return !strValue.includes(searchValue);
            case 'startsWith':
              return strValue.startsWith(searchValue);
            case 'endsWith':
              return strValue.endsWith(searchValue);
            case 'in':
              return filterValue
                .split(',')
                .map((v) => v.trim().toLowerCase())
                .includes(strValue);
            case 'notIn':
              return !filterValue
                .split(',')
                .map((v) => v.trim().toLowerCase())
                .includes(strValue);
            case 'regex':
              try {
                return new RegExp(filterValue, 'i').test(fieldValue);
              } catch {
                return false;
              }
            default:
              return true;
          }
        }

        // Number operations
        if (typeof fieldValue === 'number') {
          const numValue = fieldValue;
          const searchNum = parseFloat(filterValue);

          if (isNaN(searchNum)) return false;

          switch (filter.operator) {
            case 'equals':
              return numValue === searchNum;
            case 'notEquals':
              return numValue !== searchNum;
            case 'greaterThan':
              return numValue > searchNum;
            case 'greaterThanOrEqual':
              return numValue >= searchNum;
            case 'lessThan':
              return numValue < searchNum;
            case 'lessThanOrEqual':
              return numValue <= searchNum;
            case 'between': {
              const [min, max] = filterValue.split(',').map((v) => parseFloat(v.trim()));
              if (isNaN(min) || isNaN(max)) return false;
              return numValue >= min && numValue <= max;
            }
            case 'in':
              return filterValue
                .split(',')
                .map((v) => parseFloat(v.trim()))
                .includes(numValue);
            case 'notIn':
              return !filterValue
                .split(',')
                .map((v) => parseFloat(v.trim()))
                .includes(numValue);
            default:
              return true;
          }
        }

        // Array operations
        if (Array.isArray(fieldValue)) {
          const searchValues = filterValue.split(',').map((v) => v.trim());

          switch (filter.operator) {
            case 'contains':
              return searchValues.some((sv) =>
                fieldValue.some((fv) => String(fv).toLowerCase().includes(sv.toLowerCase())),
              );
            case 'notContains':
              return !searchValues.some((sv) =>
                fieldValue.some((fv) => String(fv).toLowerCase().includes(sv.toLowerCase())),
              );
            case 'containsAll':
              return searchValues.every((sv) =>
                fieldValue.some((fv) => String(fv).toLowerCase().includes(sv.toLowerCase())),
              );
            case 'containsAny':
              return searchValues.some((sv) =>
                fieldValue.some((fv) => String(fv).toLowerCase().includes(sv.toLowerCase())),
              );
            case 'isEmpty':
              return fieldValue.length === 0;
            case 'isNotEmpty':
              return fieldValue.length > 0;
            case 'sizeEquals':
              return fieldValue.length === parseInt(filterValue);
            case 'sizeGreaterThan':
              return fieldValue.length > parseInt(filterValue);
            case 'sizeLessThan':
              return fieldValue.length < parseInt(filterValue);
            default:
              return true;
          }
        }

        // Object operations
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          switch (filter.operator) {
            case 'hasKey':
              return filterValue in fieldValue;
            case 'notHasKey':
              return !(filterValue in fieldValue);
            case 'keyEquals': {
              const [key, value] = filterValue.split(':').map((v) => v.trim());
              if (!key || value === undefined) return false;
              return fieldValue[key] === value;
            }
            case 'keyNotEquals': {
              const [key, value] = filterValue.split(':').map((v) => v.trim());
              if (!key || value === undefined) return false;
              return fieldValue[key] !== value;
            }
            case 'isEmpty':
              return Object.keys(fieldValue).length === 0;
            case 'isNotEmpty':
              return Object.keys(fieldValue).length > 0;
            default:
              return true;
          }
        }

        return true;
      });
    });
  }
}

export default ViewsService;
