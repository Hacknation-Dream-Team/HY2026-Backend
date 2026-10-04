const fs = require('fs');

function fix(file, replaces) {
  let content = fs.readFileSync(file, 'utf8');
  replaces.forEach(r => content = content.replace(r[0], r[1]));
  fs.writeFileSync(file, content);
}

fix('src/AddressAutocomplete.tsx', [
  [/import \{ MapPin \} from 'lucide-react';\r?\n/, '']
]);

fix('src/views/ChatsView.tsx', [
  [/import \{ ArrowLeft, UserCircle2, MapPin, Clock, Send, Calendar, Check, X \} from 'lucide-react';/, "import { Check, X } from 'lucide-react';"],
  [/activeChatId: string \| null, /, ''],
  [/activeChatId, /, '']
]);

fix('src/views/DiscoverView.tsx', [
  [/import \{ Car, UserCircle2, PlusCircle, Calendar as CalendarIcon, Clock, MapPin, Trash2, ArrowLeft, Search, Map \} from 'lucide-react';/, "import { PlusCircle, Clock, MapPin, ArrowLeft, Search } from 'lucide-react';"],
  [/onOpenChat, user /, ''],
  [/onOpenChat: \(chatId: string\) => void, user\?: any /, '']
]);

fix('src/views/LoginView.tsx', [
  [/import \{ useState, useEffect \} from 'react';/, "import { useState } from 'react';"]
]);

fix('src/Wizard.tsx', [
  [/import \{ MapPin, Car, Briefcase, User as UserIcon, ArrowRight \} from 'lucide-react';/, "import { MapPin, Car, Briefcase, User as UserIcon } from 'lucide-react';"]
]);
