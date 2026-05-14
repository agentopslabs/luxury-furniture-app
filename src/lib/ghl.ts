
export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface GHLAppointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
}

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

/**
 * Mocking GHL API behavior for the purpose of the prototype
 * In production, these would be real fetch calls to GHL with valid credentials.
 */
class GHLService {
  private getHeaders() {
    return {
      'Authorization': `Bearer ${process.env.GHL_API_KEY || 'MOCK_TOKEN'}`,
      'Version': GHL_VERSION,
      'Content-Type': 'application/json',
    };
  }

  async searchContacts(email: string): Promise<GHLContact[]> {
    // Simulated Search
    console.log(`GHL: Searching contacts for ${email}`);
    if (email === 'test@example.com') {
      return [{
        id: 'contact_1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        tags: ['onboarding-completed']
      }];
    }
    return [];
  }

  async upsertContact(data: Partial<GHLContact>): Promise<GHLContact> {
    console.log(`GHL: Upserting contact ${data.email}`);
    return {
      id: `contact_${Math.random().toString(36).substr(2, 9)}`,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      tags: data.tags || []
    };
  }

  async getContact(id: string): Promise<GHLContact> {
    return {
      id,
      firstName: 'Alex',
      lastName: 'Sterling',
      email: 'alex@koreauth.io',
      tags: ['enterprise-vip', 'active-session']
    };
  }

  async getAppointments(contactId: string): Promise<GHLAppointment[]> {
    return [
      {
        id: 'appt_1',
        title: 'Strategy Session',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        status: 'confirmed'
      },
      {
        id: 'appt_2',
        title: 'Project Review',
        startTime: new Date(Date.now() - 172800000).toISOString(),
        endTime: new Date(Date.now() - 169200000).toISOString(),
        status: 'completed'
      }
    ];
  }

  async addNote(contactId: string, body: string): Promise<void> {
    console.log(`GHL: Adding note to ${contactId}: ${body}`);
  }
  
  async addTags(contactId: string, tags: string[]): Promise<void> {
    console.log(`GHL: Adding tags to ${contactId}: ${tags.join(', ')}`);
  }
}

export const ghl = new GHLService();
