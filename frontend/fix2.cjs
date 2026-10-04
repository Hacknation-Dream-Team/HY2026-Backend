const fs = require('fs');

function replace(file, search, rep) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(search, rep);
  fs.writeFileSync(file, c);
}

replace('src/AddressAutocomplete.tsx', /import \{ MapPin \} from 'lucide-react';\r?\n/, '');

replace('src/MainView.tsx', /const \[activeChatId, setActiveChatId\] = useState<string \| null>\(null\);/, 'const [, setActiveChatId] = useState<string | null>(null);');

replace('src/views/ChatsView.tsx', /export function ChatsView\(\{\s*\}\s*:\s*\{/, 'export function ChatsView({ user }: { user?: any, ');

replace('src/views/DiscoverView.tsx', /export function DiscoverView\(\{ user, onOpenChat \}: \{ user\?: any, onOpenChat: \(id: string\) => void \}\) \{/, 'export function DiscoverView({ user }: { user?: any }) {');
replace('src/views/DiscoverView.tsx', /import \{ PlusCircle, Clock, MapPin, ArrowLeft, Search \} from 'lucide-react';/, "import { Car, UserCircle2, PlusCircle, Clock, MapPin, ArrowLeft, Search } from 'lucide-react';");

replace('src/Wizard.tsx', /import \{ MapPin, Car, Briefcase, User as UserIcon \} from 'lucide-react';/, "import { MapPin, Car, Briefcase, User as UserIcon } from 'lucide-react';");
replace('src/Wizard.tsx', /const \[homeCoords, setHomeCoords\] = useState<any>\(null\);/, 'const [, setHomeCoords] = useState<any>(null);');
