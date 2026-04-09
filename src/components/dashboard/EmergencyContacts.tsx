import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Phone, Mail, Star, AlertTriangle, Search, Loader2, User } from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  is_primary: boolean;
  contact_user_id: string | null;
}

interface RegisteredUser {
  user_id: string;
  email: string;
  full_name: string | null;
}

const AP_POLICE_NUMBER = "100";
const AP_AMBULANCE_NUMBER = "108";
const AP_FIRE_NUMBER = "101";
const AP_WOMEN_HELPLINE = "181";

export const EmergencyContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Registered user search
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<RegisteredUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState("");
  
  // Manual contact form
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualIsPrimary, setManualIsPrimary] = useState(false);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .rpc("search_profile_by_email", { _email: searchEmail.trim() });

      if (error) throw error;
      
      const existingUserIds = contacts
        .filter(c => c.contact_user_id)
        .map(c => c.contact_user_id);
      
      const filteredResults = (data || []).filter(
        u => u.user_id !== user?.id && !existingUserIds.includes(u.user_id)
      );

      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0) {
        toast({
          title: "No users found",
          description: "No registered users found with that email or they are already your contacts",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (selectedUserData: RegisteredUser) => {
    setSelectedUser(selectedUserData);
    setSearchResults([]);
    setSearchEmail("");
  };

  const handleAddRegisteredContact = async () => {
    if (!user || !selectedUser) return;

    setSaving(true);
    try {
      if (isPrimary) {
        await supabase
          .from("emergency_contacts")
          .update({ is_primary: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: user.id,
        contact_user_id: selectedUser.user_id,
        name: selectedUser.full_name || selectedUser.email.split('@')[0],
        phone: registeredPhone.trim(),
        email: selectedUser.email,
        is_primary: isPrimary,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registered contact added successfully",
      });

      setSelectedUser(null);
      setIsPrimary(false);
      setRegisteredPhone("");
      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddManualContact = async () => {
    if (!user) return;
    
    if (!manualName.trim() || !manualPhone.trim()) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (manualIsPrimary) {
        await supabase
          .from("emergency_contacts")
          .update({ is_primary: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: user.id,
        contact_user_id: null,
        name: manualName.trim(),
        phone: manualPhone.trim(),
        email: manualEmail.trim() || null,
        is_primary: manualIsPrimary,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact added successfully",
      });

      setManualName("");
      setManualPhone("");
      setManualEmail("");
      setManualIsPrimary(false);
      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (id: string) => {
    if (!user) return;

    try {
      await supabase
        .from("emergency_contacts")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("emergency_contacts")
        .update({ is_primary: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Primary contact updated",
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmergencyCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const registeredContacts = contacts.filter(c => c.contact_user_id);
  const manualContacts = contacts.filter(c => !c.contact_user_id);

  return (
    <div className="space-y-6">
      {/* Emergency Quick Dial */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            AP Emergency Services - Quick Dial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={() => handleEmergencyCall(AP_POLICE_NUMBER)}
            >
              <Phone className="h-4 w-4" />
              Police (100)
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-orange-500 text-orange-500 hover:bg-orange-500/10"
              onClick={() => handleEmergencyCall(AP_AMBULANCE_NUMBER)}
            >
              <Phone className="h-4 w-4" />
              Ambulance (108)
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-500/10"
              onClick={() => handleEmergencyCall(AP_FIRE_NUMBER)}
            >
              <Phone className="h-4 w-4" />
              Fire (101)
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-purple-500 text-purple-500 hover:bg-purple-500/10"
              onClick={() => handleEmergencyCall(AP_WOMEN_HELPLINE)}
            >
              <Phone className="h-4 w-4" />
              Women (181)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add New Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="registered" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="registered">Registered User</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            {/* Registered User Tab */}
            <TabsContent value="registered" className="space-y-4">
              <div className="space-y-2">
                <Label>Search by Email</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter user's email to search..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  />
                  <Button onClick={handleSearchUser} disabled={searching}>
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calls to registered users will appear in their received calls history
                </p>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Select a user to add:</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.user_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSelectUser(result)}
                      >
                        <div>
                          <p className="font-medium">{result.full_name || result.email.split('@')[0]}</p>
                          <p className="text-sm text-muted-foreground">{result.email}</p>
                        </div>
                        <Button size="sm" variant="outline">Select</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser && (
                <div className="space-y-4 p-4 rounded-lg border bg-accent/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Selected: {selectedUser.full_name || selectedUser.email.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setSelectedUser(null)}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registered_phone">Phone Number *</Label>
                    <Input
                      id="registered_phone"
                      value={registeredPhone}
                      onChange={(e) => setRegisteredPhone(e.target.value)}
                      placeholder="Enter contact's phone number"
                      type="tel"
                    />
                    <p className="text-xs text-muted-foreground">Required to enable direct calling</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_primary_registered"
                      checked={isPrimary}
                      onCheckedChange={setIsPrimary}
                    />
                    <Label htmlFor="is_primary_registered">Set as primary contact</Label>
                  </div>
                  <Button onClick={handleAddRegisteredContact} disabled={saving || !registeredPhone.trim()} className="w-full">
                    {saving ? "Adding..." : "Add Registered Contact"}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual_name">Name *</Label>
                  <Input
                    id="manual_name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual_phone">Phone Number *</Label>
                  <Input
                    id="manual_phone"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual_email">Email (Optional)</Label>
                  <Input
                    id="manual_email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="Email address"
                    type="email"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_primary_manual"
                    checked={manualIsPrimary}
                    onCheckedChange={setManualIsPrimary}
                  />
                  <Label htmlFor="is_primary_manual">Set as primary contact</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manual contacts are for non-registered users. Calls won't appear in their history.
                </p>
                <Button onClick={handleAddManualContact} disabled={saving} className="w-full">
                  {saving ? "Adding..." : "Add Manual Contact"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contact List */}
      <Card>
        <CardHeader>
          <CardTitle>My Emergency Contacts ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No emergency contacts added yet. Add registered users or manual contacts above.
            </p>
          ) : (
            <div className="space-y-4">
              {registeredContacts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Registered Users ({registeredContacts.length})
                  </h4>
                  {registeredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{contact.name}</span>
                            {contact.is_primary && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              Registered
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </span>
                            )}
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmergencyCall(contact.phone)}
                            title="Call"
                            className="text-green-600 border-green-500 hover:bg-green-500/10"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {!contact.is_primary && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetPrimary(contact.id)}
                            title="Set as primary"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {manualContacts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Manual Contacts ({manualContacts.length})
                  </h4>
                  {manualContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{contact.name}</span>
                            {contact.is_primary && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </span>
                            )}
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmergencyCall(contact.phone)}
                            title="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {!contact.is_primary && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetPrimary(contact.id)}
                            title="Set as primary"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};