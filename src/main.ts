import './ui/styles.css';
import { App } from './app/App';

const app = new App();
app.boot().catch((e) => {
  console.error('DEEP TIME failed to start', e);
});
