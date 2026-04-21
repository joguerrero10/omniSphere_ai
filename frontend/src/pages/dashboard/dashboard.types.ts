export type Tone = "positive" | "negative" | "neutral";

export type KpiCard = {
  label: string;
  value: string;
  delta: string;
  tone: Tone;
};

export type CompanyRow = {
  name: string;
  bots: string;
  conversations: string;
  status: "Activa" | "Pausada" | "Trial" | "Inactiva";
};

export type BotRow = {
  name: string;
  company: string;
  value: number;
  color: string;
};

export type UserActivityRow = {
  title: string;
  detail: string;
  status: string;
  time: string;
};