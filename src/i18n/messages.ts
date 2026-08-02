import type { SupportedLocale } from "./config";

type Messages = {
  metadata: { title: string; description: string };
  languageSwitcher: string;
  languages: Record<SupportedLocale, string>;
  sectionsNavigation: string;
  panels: {
    profile: string;
    experience: string;
    projects: string;
    projectMetadata: string;
    contact: string;
  };
  labels: {
    designation: string;
    status: string;
    clearance: string;
    technicalSpecs: string;
    systemLog: string;
    selectSector: string;
  };
  profileValues: Record<string, string>;
  project: {
    backToSectors: string;
    backToProjects: string;
    openLive: string;
    linkUnavailable: string;
  };
  contact: {
    name: string;
    email: string;
    message: string;
    website: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    successDescription: string;
    newTransmission: string;
    verificationPending: string;
    verificationFailed: string;
    invalidPayload: string;
    transferFailed: string;
    connectionLost: string;
  };
  dock: { about: string; log: string; projects: string; contact: string };
};

export const messages: Record<SupportedLocale, Messages> = {
  en: {
    metadata: {
      title: "Aetheris // Nickraspy Portfolio",
      description: "Holographic full-stack developer portfolio.",
    },
    languageSwitcher: "Language",
    languages: { en: "English", ru: "Russian" },
    sectionsNavigation: "Portfolio sections",
    panels: {
      profile: "SYS_PROFILE",
      experience: "CHRONO_CORE",
      projects: "DATABANK_DIR",
      projectMetadata: "FILE_METADATA",
      contact: "COMMLINK",
    },
    labels: {
      designation: "DESIGNATION",
      status: "STATUS",
      clearance: "CLEARANCE",
      technicalSpecs: "TECH_SPECS",
      systemLog: "SYSTEM_LOG",
      selectSector: "SELECT_SECTOR",
    },
    profileValues: { ONLINE: "ONLINE", LEVEL_5: "LEVEL_5" },
    project: {
      backToSectors: "Back to sectors",
      backToProjects: "Back to projects",
      openLive: "INITIATE_SYNC_LINK",
      linkUnavailable: "LINK_NOT_AVAILABLE",
    },
    contact: {
      name: "IDENTIFIER",
      email: "FREQUENCY_ROUTE",
      message: "DATA_PAYLOAD",
      website: "WEBSITE",
      namePlaceholder: "Enter name",
      emailPlaceholder: "Enter email",
      messagePlaceholder: "Transmit message…",
      submit: "INITIATE_TRANSFER",
      submitting: "TRANSMITTING…",
      success: "TRANSFER_COMPLETE",
      successDescription: "Signal received. Response window: 24–48 hours.",
      newTransmission: "NEW_TRANSMISSION",
      verificationPending: "VERIFICATION_PENDING // Wait and retry.",
      verificationFailed: "VERIFICATION_FAILED // Complete a new check.",
      invalidPayload: "INVALID_PAYLOAD // Check all fields.",
      transferFailed: "TRANSFER_FAILED // Retry later.",
      connectionLost: "CONNECTION_LOST // Retry later.",
    },
    dock: { about: "ABOUT", log: "LOG", projects: "PROJ", contact: "LINK" },
  },
  ru: {
    metadata: {
      title: "Aetheris // Портфолио Nickraspy",
      description: "Голографическое портфолио full-stack разработчика.",
    },
    languageSwitcher: "Язык",
    languages: { en: "Английский", ru: "Русский" },
    sectionsNavigation: "Разделы портфолио",
    panels: {
      profile: "СИСТЕМНЫЙ_ПРОФИЛЬ",
      experience: "ХРОНОЛОГИЯ",
      projects: "БАНК_ПРОЕКТОВ",
      projectMetadata: "ДАННЫЕ_ПРОЕКТА",
      contact: "КАНАЛ_СВЯЗИ",
    },
    labels: {
      designation: "СПЕЦИАЛИЗАЦИЯ",
      status: "СТАТУС",
      clearance: "ДОПУСК",
      technicalSpecs: "ТЕХНОЛОГИИ",
      systemLog: "ОПЫТ",
      selectSector: "ВЫБЕРИТЕ_РАЗДЕЛ",
    },
    profileValues: { ONLINE: "В_СЕТИ", LEVEL_5: "УРОВЕНЬ_5" },
    project: {
      backToSectors: "Назад к разделам",
      backToProjects: "Назад к проектам",
      openLive: "ОТКРЫТЬ_ПРОЕКТ",
      linkUnavailable: "ССЫЛКА_НЕДОСТУПНА",
    },
    contact: {
      name: "ИМЯ",
      email: "ЭЛЕКТРОННАЯ_ПОЧТА",
      message: "СООБЩЕНИЕ",
      website: "САЙТ",
      namePlaceholder: "Введите имя",
      emailPlaceholder: "Введите email",
      messagePlaceholder: "Введите сообщение…",
      submit: "ОТПРАВИТЬ",
      submitting: "ОТПРАВКА…",
      success: "СООБЩЕНИЕ_ОТПРАВЛЕНО",
      successDescription: "Сигнал получен. Отвечу в течение 24–48 часов.",
      newTransmission: "НОВОЕ_СООБЩЕНИЕ",
      verificationPending: "ПРОВЕРКА_НЕ_ЗАВЕРШЕНА // Подождите и повторите.",
      verificationFailed: "ОШИБКА_ПРОВЕРКИ // Пройдите проверку ещё раз.",
      invalidPayload: "НЕКОРРЕКТНЫЕ_ДАННЫЕ // Проверьте все поля.",
      transferFailed: "ОШИБКА_ОТПРАВКИ // Повторите позже.",
      connectionLost: "НЕТ_СВЯЗИ // Повторите позже.",
    },
    dock: { about: "ПРОФИЛЬ", log: "ОПЫТ", projects: "ПРОЕКТЫ", contact: "СВЯЗЬ" },
  },
};
