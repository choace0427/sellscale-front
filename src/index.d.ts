declare module "react-render-html";
export interface MsgResponse {
  status: "success" | "error";
  title: string;
  message: string;
  data?: any;
}

export interface Campaign {
  uuid: string;
  id: number;
  name: string;
  prospect_ids: number[];
  campaign_type: Channel;
  ctas: number[];
  client_archetype_id: number;
  client_sdr_id: number;
  campaign_start_date: Date;
  campaign_end_date: Date;
  analytics_sent: number;
  analytics_open_rate: number;
  analytics_reply_rate: number;
  analytics_demo_count: number;
  num_acceptances: number;
  num_replies: number;
  num_demos: number;
  demos: list;
  status:
    | "PENDING"
    | "NEEDS_REVIEW"
    | "IN_PROGRESS"
    | "INITIAL_EDIT_COMPLETE"
    | "READY_TO_SEND"
    | "COMPLETE"
    | "CANCELLED";
}

export interface Sequence {
  id: number;
  title: string;
  client_sdr_id: number;
  archetype_id: number;
  data: { subject: string; body: string }[];
  status: string;
}

export interface Prospect {
  approved_outreach_message_id: number | null;
  approved_prospect_email_id: number | null;
  archetype_id: number;
  batch: string;
  client_id: number;
  client_sdr_id: number;
  location: string;
  company: string;
  company_url: string;
  company_hq: string;
  deactivate_ai_engagement: boolean;
  email: string;
  employee_count: string;
  first_name: string;
  full_name: string;
  id: number;
  industry: string;
  is_lead: null;
  last_name: string;
  last_position: null;
  last_reviewed: Date;
  li_conversation_thread_id: string;
  li_is_last_message_from_sdr: boolean;
  li_last_message_from_prospect: string;
  li_last_message_from_sdr: string;
  li_last_message_timestamp: string;
  li_unread_messages: number | null;
  email_is_last_message_from_sdr: boolean | null;
  email_last_message_from_prospect: string | null;
  email_last_message_from_sdr: string | null;
  email_last_message_timestamp: string | null;
  email_unread_messages: number | null;
  linkedin_bio: string | null;
  linkedin_url: string;
  times_bumped: null;
  title: string;
  twitter_url: string | null;
  overall_status: string;
  linkedin_status: string;
  email_status: string;
  img_url: string;
  img_expire: string;
  recent_messages: any;
  hidden_until: string;
  hidden_reason: string;
  demo_date: any;
  icp_fit_score: number;
  icp_fit_reason: string;
  icp_fit_error: string;
  archetype_name: string;
  pipeline_notifications_webhook_url: string;
  in_icp_sample: boolean | null;
  icp_fit_score_override: number | null;
  email_store: EmailStore;
  contract_size: number;
  matched_filter_words?: string[];
}

export interface ProspectShallow {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  email: string;
  icp_fit_score: number;
  icp_fit_reason: string;
  li_public_id: string | null;
  img_url: string;
  archetype_id: number;
  hidden_until: string;
  hidden_reason: string;
  demo_date: string;
  deactivate_ai_engagement: boolean;
  is_lead: boolean;
  overall_status: string;
  linkedin_status: string;
  email_status: string;
  li_urn_id: string;
  li_conversation_urn_id: string;
  li_last_message_timestamp: string;
  li_is_last_message_from_sdr: boolean;
  li_last_message_from_prospect: string;
  li_last_message_from_sdr: string;
  li_unread_messages: number;
  email_last_message_timestamp: string;
  email_is_last_message_from_sdr: boolean;
  email_last_message_from_prospect: string;
  email_last_message_from_sdr: string;
  email_unread_messages: number;
  in_icp_sample: boolean | null;
  icp_fit_score_override: number | null;
  contract_size: number;
}

export interface ProspectICP {
  company: string;
  full_name: string;
  icp_fit_reason: string;
  icp_fit_score: number;
  id: number;
  industry: string;
  linkedin_url: string;
  title: string;
  status: string;
  has_been_sent_outreach: boolean;
}

export interface ProspectDetails {
  details: {
    id: number;
    full_name: string;
    title: string;
    company: string;
    address: string;
    status: string;
    overall_status: string;
    linkedin_status: string;
    bump_count: number;
    icp_fit_score: number;
    icp_fit_reason: string;
    email_status: string;
    profile_pic: string;
    ai_responses_disabled: boolean;
    notes: any[];
    persona: string;
    persona_id: number;
    demo_date: string;
  };
  data: Prospect;
  li: {
    li_conversation_url: string;
    li_conversation_thread: string;
    li_profile: string;
  };
  email: {
    email: string;
    email_status: string;
  };
  company: {
    logo: string;
    name: string;
    location: string;
    tags: string[];
    tagline: string;
    description: string;
    url: string;
    employee_count: string;
  };
  referrals: { id: number; full_name: string }[];
  referred: { id: number; full_name: string }[];
}

export interface DemoFeedback {
  client_id: number;
  client_sdr_id: number;
  demo_date: string;
  feedback: string;
  id: number;
  prospect_id: number;
  prospect_img_url: string;
  prospect_name: string;
  rating: string;
  status: string;
  demo_date: Date;
  next_demo_date: Date;
}

export interface Simulation {
  id: number;
  client_sdr_id: number;
  archetype_id: number;
  prospect_id: number;
  prospect?: Prospect;
  type: string;
  meta_data: Record<string, any>;
}

export interface CTA {
  id: number;
  archetype_id: number;
  active: boolean;
  text_value: string;
  expiration_date?: string;
  performance?: {
    status_map: Record<string, number>;
    total_count: number;
    num_sent: number;
    num_converted: number;
  };
  cta_type: string;
  auto_mark_as_scheduling_on_acceptance: boolean;
}

export interface Archetype {
  active: boolean;
  archetype: string;
  client_id: number;
  client_sdr_id: number;
  disable_ai_after_prospect_engaged: boolean;
  filters: null; // TODO:
  id: number;
  performance: {
    status_map: Record<string, number>;
    total_prospects: number;
  };
  transformer_blocklist: null; // TODO:
  uploads?: any[];
  icp_matching_prompt: string;
  is_unassigned_contact_archetype: boolean;
  ctas: CTA[];
  contract_size: number;
}

export interface PersonaOverview {
  active: boolean;
  id: number;
  name: string;
  num_prospects: number;
  num_unused_email_prospects: number;
  num_unused_li_prospects: number;
  icp_matching_prompt: string;
  icp_matching_option_filters: Record<string, boolean>;
  is_unassigned_contact_archetype: boolean;
  persona_fit_reason: string;
  persona_contact_objective: string;
  uploads?: any[];
  contract_size: number;
  transformer_blocklist?: string[];
  transformer_blocklist_initial?: string[];
  emoji: string;
  avg_icp_fit_score: number;
  li_bump_amount: number;
  cta_framework_company: string;
  cta_framework_persona: string;
  cta_framework_action: string;
  use_cases: string;
  filters: string;
  lookalike_profile_1: string;
  lookalike_profile_2: string;
  lookalike_profile_3: string;
  lookalike_profile_4: string;
  lookalike_profile_5: string;
  template_mode: boolean;
  smartlead_campaign_id?: number;
  meta_data?: Record<string, any>;
}

export interface LinkedInMessage {
  author: string;
  connection_degree: string;
  conversation_url: string;
  date: string;
  first_name: string;
  last_name: string;
  headline: string;
  img_url: string;
  li_url: string;
  message: string;
  profile_url: string;
  urn_id: string;
  ai_generated: boolean;
  bump_framework_id: number;
  bump_framework_title: string;
  bump_framework_description: string;
  bump_framework_length: string;
  account_research_points: string[];
  initial_message_id: number;
  initial_message_cta_id: number;
  initial_message_cta_text: string;
  initial_message_research_points: string[];
  initial_message_stack_ranked_config_id: number;
  initial_message_stack_ranked_config_name: string;
}

export interface EmailThread {
  client_sdr_id: number;
  first_message_timestamp: string;
  has_attachments: boolean;
  id: number;
  last_message_received_timestamp: string;
  last_message_sent_timestamp: string;
  last_message_timestamp: string;
  nylas_data_raw: {};
  nylas_message_ids: string[];
  nylas_thread_id: string;
  participants: {
    email: string;
    name: string;
  }[];
  prospect_email: string;
  prospect_id: number;
  sdr_email: string;
  snippet: string;
  subject: string;
  unread: boolean;
  version: number;
}

export interface EmailMessage {
  ai_generated: boolean | null;
  bcc: string[];
  body: string;
  cc: string[];
  client_sdr_id: number;
  date_received: string;
  email_conversation_thread_id: number;
  files: any[];
  from_prospect: boolean;
  from_sdr: boolean;
  id: number;
  message_from: {
    email: string;
    name: string;
  }[];
  message_to: {
    email: string;
    name: string;
  }[];
  nylas_message_id: string;
  nylas_thread_id: string;
  prospect_email: string;
  prospect_id: number;
  reply_to: string[];
  sdr_email: string;
  snippet: string;
  subject: string;
}

export interface ProspectNote {
  created_at: string;
  id: number;
  note: string;
  prospect_id: number;
}

export interface ProspectEmail extends Record<string, unknown> {
  email: string;
  subject: string;
  body: string;
  date: number;
  from: string;
}

export type Channel = "EMAIL" | "LINKEDIN" | "SELLSCALE";

export type BumpFramework = {
  id: number;
  title: string;
  created_at: Date;
  description: string;
  overall_status: string;
  substatus: string;
  active: boolean;
  default: boolean;
  bump_length: string;
  bumped_count: number | null;
  bump_delay_days: number;
  use_account_research: boolean;
  client_archetype_id: number;
  client_archetype_archetype: string;
  account_research?: string[];
  etl_num_times_used?: number;
  etl_num_times_converted?: number;
  transformer_blocklist: string[];
  active_transformers: string[];
  additional_context?: string;
  bump_framework_template_name?: string;
  bump_framework_human_readable_prompt?: string;
  human_feedback?: string;
};

export type EmailSequenceStep = {
  id: number;
  title: string;
  template: string;
  overall_status: string;
  substatus: string;
  active: boolean;
  default: boolean;
  bumped_count: number | null;
  sequence_delay_days: number | null;
  transformer_blocklist: string[];
  // TODO: MISSING A LOT OF FIELDS
};

export type SubjectLineTemplate = {
  id: number;
  subject_line: string;
  client_sdr_id: number;
  client_archetype_id: number;
  client_archetype_archetype: string;
  active: boolean;
  times_used: number;
  times_accepted: number;
  sellscale_generated: boolean;
};

export type SpamScoreResults = {
  read_minutes: number;
  read_minutes_score: number;
  spam_word_score: number;
  spam_words: string[];
  total_score: number;
}

export type SalesNavigatorLaunch = {
  id: number;
  sales_navigator_config_id: number;
  client_sdr_id: number;
  sales_navigator_url: string;
  scrape_count: number;
  status: string;
  pb_container_id: string;
  result_available: boolean;
  launch_date: Date;
  name: string;
  client_archetype_id: number;
  archetype: string;
};

export type EmailStore = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  hunter_status: string;
  hunter_score: number;
  hunter_regexp: boolean;
  hunter_gibberish: boolean;
  hunter_disposable: boolean;
  hunter_webmail: boolean;
  hunter_mx_records: boolean;
  hunter_smtp_server: boolean;
  hunter_smtp_check: boolean;
  hunter_accept_all: boolean;
  hunter_block: boolean;
  hunter_sources: {}[];
};

export interface Individual {
  id: number;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  bio: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  li_public_id: string | null;
  li_urn_id: string | null;
  img_url: string | null;
  img_expire: number;
  industry: string | null;
  company: Company | null;
  followers: {
    linkedin: number | null;
    instagram: number | null;
    facebook: number | null;
    twitter: number | null;
  };
  birth_date: string | null; // Assuming it's a date string
  location: Record<string, any> | null;
  language: {
    country: string | null;
    locale: string | null;
  };
  skills: string[] | null;
  websites: Array<Record<string, any>> | null;
  education: {
    recent_school: string | null;
    recent_degree: string | null;
    recent_field: string | null;
    recent_start_date: string | null; // Assuming it's a date string
    recent_end_date: string | null; // Assuming it's a date string
    history: Array<Record<string, any>> | null;
  };
  patents: Array<Record<string, any>> | null;
  awards: Array<Record<string, any>> | null;
  certifications: Array<Record<string, any>> | null;
  organizations: Array<Record<string, any>> | null;
  projects: Array<Record<string, any>> | null;
  publications: Array<Record<string, any>> | null;
  courses: Array<Record<string, any>> | null;
  test_scores: Array<Record<string, any>> | null;
  work: {
    recent_title: string | null;
    recent_company: string | null;
    recent_start_date: string | null; // Assuming it's a date string
    recent_end_date: string | null; // Assuming it's a date string
    recent_description: string | null;
    recent_location: Record<string, any> | null;
    history: Array<Record<string, any>> | null;
  };
  volunteer: Array<Record<string, any>> | null;
  similar_profiles: Array<Record<string, any>> | null;
}


interface EmailTemplate {
  id: number;
  name: string;
  description: string | null;
  template: string;
  template_type: "SUBJECT_LINE" | "BODY";
  active: boolean;
  transformer_blocklist: string[] | null;
  tone: string | null;
  labels: string[] | null;
}

interface EmailWarming {
  id: number;
  email: string;
  name: string;
  status: string;
  total_sent: number;
  total_spam: number;
  warmup_reputation: string;
  sent_count: string;
  spam_count: string;
  inbox_count: string;
  warmup_email_received_count: string;
  stats_by_date: Record<string, any>[];
  percent_complete: number;
}
