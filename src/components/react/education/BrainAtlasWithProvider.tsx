import { TMSProvider } from '../TMSViewer/TMSContext';
import BrainAtlas from './BrainAtlas';

export default function BrainAtlasWithProvider() {
  return (
    <TMSProvider>
      <BrainAtlas />
    </TMSProvider>
  );
}
