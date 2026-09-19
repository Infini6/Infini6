import { apiService } from './api';
import { JourneyStepStatus } from '../types/database.types';

export const journeyService = {
  async getJourneyByAppointment(appointmentId: string) {
    return apiService.getJourneyByAppointment(appointmentId);
  },

  async updateStepStatus(stepId: string, status: JourneyStepStatus) {
    return apiService.updateJourneyStep(stepId, status);
  },

  async getTemplates(hospitalId: string) {
    return apiService.getJourneyTemplates(hospitalId);
  },

  async createTemplate(
    tpl: {
      hospital_id: string;
      department_id?: string;
      name: string;
      description?: string;
      steps: Array<{ name: string; location: string; expected_duration: number }>;
    },
    actorId?: string
  ) {
    return apiService.createJourneyTemplate(tpl, actorId);
  },

  async updateTemplateSteps(
    templateId: string,
    steps: Array<{ name: string; location: string; expected_duration: number; step_order: number }>,
    actorId?: string
  ) {
    return apiService.updateJourneyTemplateSteps(templateId, steps, actorId);
  },

  async updateTemplate(
    templateId: string,
    updates: Partial<import('../types/database.types').JourneyTemplateRow>,
    actorId?: string
  ) {
    return apiService.updateJourneyTemplate(templateId, updates, actorId);
  },

  async toggleTemplateStatus(
    templateId: string,
    status: 'ACTIVE' | 'INACTIVE',
    actorId?: string
  ) {
    return apiService.toggleJourneyTemplateStatus(templateId, status, actorId);
  },

  async deleteTemplate(templateId: string, actorId?: string) {
    return apiService.deleteJourneyTemplate(templateId, actorId);
  },

  async advanceStep(
    appointmentId: string,
    stepId: string,
    status: JourneyStepStatus = 'COMPLETED',
    actorId?: string,
    actorRole?: string
  ) {
    return apiService.advanceJourneyStep(appointmentId, stepId, status, actorId, actorRole);
  },
};
