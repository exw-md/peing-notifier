import axios from 'axios';
import { JSDOM } from 'jsdom';
import dayjs from 'dayjs';
import { Question, PermanentData } from './type';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

const environments: { [key: string]: string } = {
  APP_COOKIE: `${process.env.APP_COOKIE}`,
  APP_IFTTT_EVENT_NAME: `${process.env.APP_IFTTT_EVENT_NAME}`,
  APP_IFTTT_SERVICE_KEY: `${process.env.APP_IFTTT_SERVICE_KEY}`,
  APP_MINDB_TOKEN: `${process.env.APP_MINDB_TOKEN}`,
  APP_MINDB_URL: `${process.env.APP_MINDB_URL}`
};

const peingApiClient = axios.create({
  withCredentials: true,
  headers: {
    cookie: `${environments.APP_COOKIE || ''}`,
  },
});

if (!Object.values(environments).every((v) => !!v)) {
  console.error('Missing Environment');
  process.exit(1);
}

async function getLastUpdatedAt(): Promise<string | null> {
  const { data } = await axios.get(process.env.APP_MINDB_URL || '', {
    headers: {
      Authorization: `Bearer ${process.env.APP_MINDB_TOKEN}`
    }
  })
  return data.data
}

async function saveLastUpdatedAt(lastUpdatedAt: string) {
  await axios.put(process.env.APP_MINDB_URL || '', { value: lastUpdatedAt }, {
    headers: {
      Authorization: `Bearer ${process.env.APP_MINDB_TOKEN}`
    }
  })
  return;
}

async function run() {
  try {
    const response = await peingApiClient.get('https://peing.net/ja/box');
    const DOM = new JSDOM(response.data);
    const questionElement = DOM.window.document.body
      .querySelector('[data-questions]')
      ?.getAttribute('data-questions');
    if (!questionElement) {
      console.error('Missing question list element.');
      return;
    }
    const questions: Question[] = JSON.parse(
      decodeURIComponent(questionElement),
    );
    const [question] = questions;
    const lastUpdatedAt = await getLastUpdatedAt();

    if (dayjs(question.created_at).diff(lastUpdatedAt) < 0) {
      console.log('Missing questions');
      return;
    }

    await saveLastUpdatedAt(dayjs().format());

    await axios
      .post(
        `https://maker.ifttt.com/trigger/${environments.APP_IFTTT_EVENT_NAME}/with/key/${environments.APP_IFTTT_SERVICE_KEY}`,
        {
          value1: dayjs().format('YYYY/MM/DD HH:mm'),
          value2: question.body,
          value3: question.eye_catch.url,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((r) => {
        console.log(r);
      })
      .catch((e) => {
        console.log(e.response.data.errors);
      });
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

run();
