import { createContext, useEffect, useState, type ReactNode } from "react";

interface UserProviderProps {
  children: ReactNode;
}

// Define the type for the user profile
interface UserProfile {
  [key: string]: string | undefined | null; // Allow null for values from XML
  DisplayName?: string | null;
  UserName?: string | null;
  Title?: string | null;
  Company?: string | null; // Company code like "XXXX-YYYY-ZZZ"
  kodeCabang?: string;    // Extracted from Company
  kodeBiro?: string;      // Extracted from Company
}

// Define context type
interface UserContextType {
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  kodeCabang?: string;
  kodeBiro?: string;
  isLoadingProfile: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function parseXMLAsync(xmlString: string): Promise<Document> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        console.error('XML Parsing Error:', parserError[0].textContent);
        reject(new Error('Failed to parse XML string'));
        return;
      }
      resolve(xmlDoc);
    } catch (err) {
      console.error('Exception during XML parsing:', err);
      reject(err);
    }
  });
}

const parseUserProfileXML = (parsedXML: Document): UserProfile => {
  const profile: UserProfile = {};
  const properties = parsedXML.getElementsByTagName('d:element');

  for (let i = 0; i < properties.length; i++) {
    const keyElement = properties[i].getElementsByTagName('d:Key')[0];
    const valueElement = properties[i].getElementsByTagName('d:Value')[0];
    const key = keyElement?.textContent;
    const value = valueElement?.textContent; // value can be string or null
    if (key) {
      profile[key] = value; // This will correctly set profile.Company from the d:element
    }
  }

  // These are direct children of m:properties
  profile.DisplayName =
    parsedXML.getElementsByTagName('d:DisplayName')[0]?.textContent ?? null;
  profile.Title =
    parsedXML.getElementsByTagName('d:Title')[0]?.textContent ?? null;
  
  // The explicit assignment for profile.Company using getElementsByTagName('d:Company') 
  // is removed because 'Company' is part of the 'd:element' collection in SharePoint profile XML.
  // The loop above already handles it.

  return profile;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [kodeCabang, setKodeCabang] = useState<string | undefined>(undefined);
  const [kodeBiro, setKodeBiro] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        // 0998-0998-223 admin
        // 0971-0431-000 kcp
        // 0998-0010-000 kcu
        // 0998-0973-000 kanwil
        // 0973-7880-500 KCU Galaxy
        //U555438
        // const xmlString = `<?xml version="1.0" encoding="utf-8"?><entry xml:base="https://mybcaportal/_api/" xmlns="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns:georss="http://www.georss.org/georss" xmlns:gml="http://www.opengis.net/gml"><id>https://mybcaportal/_api/SP.UserProfiles.PeopleManager/GetMyProperties</id><category term="SP.UserProfiles.PersonProperties" scheme="http://schemas.microsoft.com/ado/2007/08/dataservices/scheme" /><link rel="edit" href="SP.UserProfiles.PeopleManager/GetMyProperties" /><title /><updated>2025-05-23T10:05:27Z</updated><author><name /></author><content type="application/xml"><m:properties><d:DisplayName>KEVIN GABRIEL FLORENTINO</d:DisplayName><d:Title>OUT SOURCE</d:Title><d:UserProfileProperties><d:element m:type="SP.KeyValue"><d:Key>UserProfile_GUID</d:Key><d:Value>2d382de7-c3c1-437e-acf4-04bdecf20900</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SID</d:Key><d:Value>S-1-5-21-862529981-594047787-1136263860-551973</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>ADGuid</d:Key><d:Value>System.Byte[]</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>AccountName</d:Key><d:Value>BCADOMAIN\U555438</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>FirstName</d:Key><d:Value>KEVIN</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PhoneticFirstName</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>LastName</d:Key><d:Value>FLORENTINO</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PhoneticLastName</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>PreferredName</d:Key><d:Value>KEVIN GABRIEL FLORENTINO</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PhoneticDisplayName</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>WorkPhone</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Department</d:Key><d:Value>RISK MANAGEMENT DIVISION</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Title</d:Key><d:Value>OUT SOURCE</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Department</d:Key><d:Value>RISK MANAGEMENT DIVISION</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Manager</d:Key><d:Value>BCADOMAIN\rmg</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>AboutMe</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>PersonalSpace</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>PictureURL</d:Key><d:Value>https://myprofile:443/User%20Photos/Profile%20Pictures/u555438_MThumb.jpg</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>UserName</d:Key><d:Value>U059080</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>QuickLinks</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>WebSite</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>PublicSiteRedirect</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-JobTitle</d:Key><d:Value>OUT SOURCE</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-DataSource</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-MemberOf</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Dotted-line</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Peers</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Responsibility</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-SipAddress</d:Key><d:Value>kevin_florentino@intra.bca</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-MySiteUpgrade</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-DontSuggestList</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ProxyAddresses</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-HireDate</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-DisplayOrder</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ClaimID</d:Key><d:Value>U555438</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ClaimProviderID</d:Key><d:Value>Windows</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-LastColleagueAdded</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-OWAUrl</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ResourceSID</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ResourceAccountName</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-MasterAccountName</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-UserPrincipalName</d:Key><d:Value>U555438@bca.co.id</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-O15FirstRunExperience</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PersonalSiteInstantiationState</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-DistinguishedName</d:Key><d:Value>CN=KEVIN GABRIEL FLORENTINO,OU=KantorPusat,DC=intra,DC=bca,DC=co,DC=id</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-SourceObjectDN</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-LastKeywordAdded</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ClaimProviderType</d:Key><d:Value>Windows</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-SavedAccountName</d:Key><d:Value>BCADOMAIN\U555438</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-SavedSID</d:Key><d:Value>System.Byte[]</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ObjectExists</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PersonalSiteCapabilities</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PersonalSiteFirstCreationTime</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PersonalSiteLastCreationTime</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PersonalSiteNumberOfRetries</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PersonalSiteFirstCreationError</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-FeedIdentifier</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>WorkEmail</d:Key><d:Value>kevin_florentino@intra.bca</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>CellPhone</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Fax</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>HomePhone</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Office</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Location</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Extension</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Assistant</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PastProjects</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Skills</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-School</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Birthday</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-StatusNotes</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Interests</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-HashTags</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-EmailOptin</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PrivacyPeople</d:Key><d:Value>True</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PrivacyActivity</d:Key><d:Value>4095</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PictureTimestamp</d:Key><d:Value>63871724126</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PicturePlaceholderState</d:Key><d:Value>1</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PictureExchangeSyncState</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-MUILanguages</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ContentLanguages</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-TimeZone</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-RegionalSettings-FollowWeb</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Locale</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-CalendarType</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-AltCalendarType</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-AdjustHijriDays</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-ShowWeeks</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-WorkDays</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-WorkDayStartHour</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-WorkDayEndHour</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-Time24</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-FirstDayOfWeek</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-FirstWeekOfYear</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-RegionalSettings-Initialized</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>OfficeGraphEnabled</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-UserType</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-HideFromAddressLists</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-RecipientTypeDetails</d:Key><d:Value>1</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>DelveFlags</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>PulseMRUPeople</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>msOnline-ObjectId</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-PointPublishingUrl</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>SPS-TenantInstanceId</d:Key><d:Value></d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>Company</d:Key><d:Value>0973-7880-223</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>PersonalTitle</d:Key><d:Value>OUT SOURCE</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>EmployeeID</d:Key><d:Value>555438</d:Value><d:ValueType>Edm.String</d:ValueType></d:element><d:element m:type="SP.KeyValue"><d:Key>UserAccountControl</d:Key><d:Value>512</d:Value><d:ValueType>Edm.String</d:ValueType></d:element></d:UserProfileProperties></m:properties></content></entry>`
        
        const response = await fetch(
          'https://mybcaportal/_api/SP.UserProfiles.PeopleManager/GetMyProperties',
          {
            headers: {
              Accept: 'application/xml',
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlString = await response.text();
        if (!xmlString) {
            throw new Error("Empty XML response from server");
        }

        const parsedXML = await parseXMLAsync(xmlString);
        const profileData = parseUserProfileXML(parsedXML);

        // console.log("UserContext: profileData after parseUserProfileXML:", JSON.stringify(profileData, null, 2));

        console.log("Username: ", profileData.UserName);

        let extractedKodeCabang: string | undefined = undefined;
        let extractedKodeBiro: string | undefined = undefined;

        if (profileData.Company && typeof profileData.Company === 'string') {
          const companyCode = profileData.Company;
          if (companyCode.length >= 9) {
            extractedKodeCabang = companyCode.substring(5, 9);
          }
          if (companyCode.length >= 13) {
            extractedKodeBiro = companyCode.substring(10, 13);
          }
          // console.log("UserContext: Parsed Company - kodeCabang:", extractedKodeCabang, "kodeBiro:", extractedKodeBiro);
        } else {
            console.warn("UserContext: Company code not found, empty, or not a string in profile:", profileData.Company);
        }
        
        profileData.kodeCabang = extractedKodeCabang;
        profileData.kodeBiro = extractedKodeBiro;

        setUserProfile(profileData);
        setKodeCabang(extractedKodeCabang);
        setKodeBiro(extractedKodeBiro);

      } catch (error) {
        console.error('UserContext: Failed to fetch or parse user profile XML', error);
        setUserProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile, kodeCabang, kodeBiro, isLoadingProfile }}>
      {children}
    </UserContext.Provider>
  );
};

