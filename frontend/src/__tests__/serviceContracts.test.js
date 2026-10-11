import { describe, it, expect, vi } from 'vitest';
vi.mock('../services/api', () => ({default: {get:vi.fn(),post:vi.fn(),patch:vi.fn()}}));
import api from '../services/api';
import { intelligenceService } from '../services/intelligenceService';
import { activityService } from '../services/activityService';
import { normalizeTaskPayload } from '../services/taskService';
describe('existing service response contracts', () => {
  it('health service returns the payload directly', async () => {
    const payload={health:{score:80,status:'AT_RISK'},risks:[{severity:'HIGH'}]};
    api.get.mockResolvedValueOnce({success:true,data:payload});
    expect(await intelligenceService.getProjectHealth(42)).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/intelligence/health/42');
  });
  it('impact and recovery services return direct proposals', async () => {
    const impact={directlyAffected:[],totalAffected:0};
    const recovery={recommendations:[],problem:{type:'TASK_DELAY'}};
    api.post.mockResolvedValueOnce({success:true,data:impact}).mockResolvedValueOnce({success:true,data:recovery});
    expect(await intelligenceService.analyzeImpact(9,3)).toEqual(impact);
    expect(await intelligenceService.generateReplan(42,{type:'TASK_DELAY'})).toEqual(recovery);
    expect(api.post).toHaveBeenCalledWith('/intelligence/impact/9',{delayDays:3});
  });
  it('lists saved recovery proposals and sends owner decisions to proposal-specific endpoints', async () => {
    const proposals = [{ id: 31, status: 'PENDING' }];
    const applied = { id: 31, status: 'APPLIED' };
    const rejected = { id: 32, status: 'REJECTED' };
    api.get.mockResolvedValueOnce({success:true,data:proposals});
    api.post.mockResolvedValueOnce({success:true,data:applied}).mockResolvedValueOnce({success:true,data:rejected});
    expect(await intelligenceService.getReplans(42)).toEqual(proposals);
    expect(await intelligenceService.applyReplan(42,31)).toEqual(applied);
    expect(await intelligenceService.rejectReplan(42,32)).toEqual(rejected);
    expect(api.get).toHaveBeenCalledWith('/intelligence/replan/42/proposals');
    expect(api.post).toHaveBeenCalledWith('/intelligence/replan/42/proposals/31/apply');
    expect(api.post).toHaveBeenCalledWith('/intelligence/replan/42/proposals/32/reject');
  });
  it('activity service returns an array directly', async () => {
    const activity=[{id:1,description:'Task created'}];
    api.get.mockResolvedValueOnce({success:true,data:activity});
    expect(await activityService.getByProject(42,{limit:5})).toEqual(activity);
  });
  it('task creation includes the route project and removes blank optional fields', () => {
    expect(normalizeTaskPayload(12,{title:'Wire checkout',estimated_hours:'',deadline:'',status:'TODO'})).toEqual({
      title:'Wire checkout',status:'TODO',project_id:12
    });
  });
});
