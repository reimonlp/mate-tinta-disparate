import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CmsService } from './cms-service';
import fs from 'node:fs';
import { z } from 'zod';

vi.mock('node:fs', () => ({
  default: {
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    unlinkSync: vi.fn()
  }
}));

vi.mock('./git', () => ({
  commitAndPush: vi.fn().mockResolvedValue(true)
}));

describe('CmsService', () => {
  const schema = z.object({
    autor: z.string()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an item', async () => {
    const data = { autor: 'Test User', text: 'Hello' };
    const result = await CmsService.createItem('comunidad', data, schema);
    
    expect(result.success).toBe(true);
    expect(result.id).toContain('test-user');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should throw if validation fails', async () => {
    const data = { invalid: 'data' };
    await expect(CmsService.createItem('comunidad', data, schema))
      .rejects.toThrow();
  });

  it('should delete an item if exists', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const result = await CmsService.deleteItem('comunidad', 'test.md');
    
    expect(result.success).toBe(true);
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});
