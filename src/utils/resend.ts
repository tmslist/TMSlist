import { Resend } from 'resend';

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

export const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;
