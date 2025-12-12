--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg110+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_raster; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_raster WITH SCHEMA public;


--
-- Name: EXTENSION postgis_raster; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_raster IS 'PostGIS raster types and functions';


--
-- Name: access_frequency_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.access_frequency_enum AS ENUM (
    'RealTime',
    'Daily',
    'Monthly'
);


ALTER TYPE public.access_frequency_enum OWNER TO postgres;

--
-- Name: application_name_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.application_name_enum AS ENUM (
    'WhatsApp',
    'Skype',
    'Signal',
    'Zoom',
    'Native Call',
    'Telegram',
    'Threema',
    'Teams',
    'Discord',
    'Other'
);


ALTER TYPE public.application_name_enum OWNER TO postgres;

--
-- Name: association_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.association_type_enum AS ENUM (
    'Reference',
    'Attachment',
    'Evidence',
    'Ownership',
    'Other'
);


ALTER TYPE public.association_type_enum OWNER TO postgres;

--
-- Name: authentication_method_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.authentication_method_enum AS ENUM (
    'API Key',
    'OAuth',
    'Basic Auth',
    'None'
);


ALTER TYPE public.authentication_method_enum OWNER TO postgres;

--
-- Name: business_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.business_status_enum AS ENUM (
    'Active',
    'Dissolved',
    'Bankrupt',
    'Other'
);


ALTER TYPE public.business_status_enum OWNER TO postgres;

--
-- Name: call_result_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.call_result_enum AS ENUM (
    'Missed',
    'Answered',
    'Rejected',
    'Voicemail',
    'Busy'
);


ALTER TYPE public.call_result_enum OWNER TO postgres;

--
-- Name: call_termination_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.call_termination_status_enum AS ENUM (
    'Completed',
    'Dropped',
    'Busy',
    'No Answer',
    'Rejected',
    'Network Error'
);


ALTER TYPE public.call_termination_status_enum OWNER TO postgres;

--
-- Name: call_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.call_type_enum AS ENUM (
    'Audio',
    'Video'
);


ALTER TYPE public.call_type_enum OWNER TO postgres;

--
-- Name: category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.category_enum AS ENUM (
    'Entertainment',
    'Education',
    'Professional',
    'E-commerce',
    'Government',
    'Other'
);


ALTER TYPE public.category_enum OWNER TO postgres;

--
-- Name: classification_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.classification_enum AS ENUM (
    'Suspect',
    'Target',
    'Witness',
    'Victim',
    'Affiliate',
    'InterestedParty',
    'Neutral'
);


ALTER TYPE public.classification_enum OWNER TO postgres;

--
-- Name: company_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.company_type_enum AS ENUM (
    'Public',
    'Private',
    'Government',
    'Non-Profit',
    'Other'
);


ALTER TYPE public.company_type_enum OWNER TO postgres;

--
-- Name: content_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.content_type_enum AS ENUM (
    'Article',
    'BlogPost',
    'NewsReport',
    'Other'
);


ALTER TYPE public.content_type_enum OWNER TO postgres;

--
-- Name: conversation_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.conversation_type_enum AS ENUM (
    'SingleChat',
    'GroupChat'
);


ALTER TYPE public.conversation_type_enum OWNER TO postgres;

--
-- Name: data_format_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.data_format_enum AS ENUM (
    'JSON',
    'XML',
    'CSV',
    'Other'
);


ALTER TYPE public.data_format_enum OWNER TO postgres;

--
-- Name: data_refresh_rate_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.data_refresh_rate_enum AS ENUM (
    'Hourly',
    'Daily',
    'Weekly',
    'Monthly',
    'On Demand'
);


ALTER TYPE public.data_refresh_rate_enum OWNER TO postgres;

--
-- Name: data_source_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.data_source_type_enum AS ENUM (
    'Database',
    'API',
    'File'
);


ALTER TYPE public.data_source_type_enum OWNER TO postgres;

--
-- Name: date_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.date_type_enum AS ENUM (
    'DoB',
    'Deceased',
    'Marriage',
    'Divorced',
    'Visited',
    'Lived',
    'Studied',
    'Graduated',
    'Traveled',
    'Operated',
    'Incorporation',
    'Closing',
    'Worked',
    'Event',
    'Custom'
);


ALTER TYPE public.date_type_enum OWNER TO postgres;

--
-- Name: degree_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.degree_enum AS ENUM (
    'Bachelor',
    'Master',
    'Doctorate',
    'Associate',
    'Diploma',
    'Certificate',
    'High School',
    'None',
    'Other',
    'Unknown'
);


ALTER TYPE public.degree_enum OWNER TO postgres;

--
-- Name: document_origin_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_origin_enum AS ENUM (
    'Scanned',
    'Emailed',
    'Uploaded',
    'Generated',
    'Other'
);


ALTER TYPE public.document_origin_enum OWNER TO postgres;

--
-- Name: document_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_type_enum AS ENUM (
    'Contract',
    'ID',
    'Report',
    'Legal',
    'Financial',
    'Other'
);


ALTER TYPE public.document_type_enum OWNER TO postgres;

--
-- Name: email_address_entity_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.email_address_entity_type_enum AS ENUM (
    'PoI',
    'Company',
    'Group',
    'BankAccount',
    'CryptoAddress',
    'Event',
    'Other'
);


ALTER TYPE public.email_address_entity_type_enum OWNER TO postgres;

--
-- Name: employment_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_type_enum AS ENUM (
    'Full-Time',
    'Part-Time',
    'Contractor',
    'Intern',
    'Consultant',
    'Freelance',
    'Other'
);


ALTER TYPE public.employment_type_enum OWNER TO postgres;

--
-- Name: enrichment_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enrichment_type_enum AS ENUM (
    'Entities',
    'Phrases',
    'CommonWords',
    'Topics',
    'Categories'
);


ALTER TYPE public.enrichment_type_enum OWNER TO postgres;

--
-- Name: entity_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.entity_type_enum AS ENUM (
    'PoI',
    'Company',
    'Group'
);


ALTER TYPE public.entity_type_enum OWNER TO postgres;

--
-- Name: etc_entity_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.etc_entity_type_enum AS ENUM (
    'PoI',
    'Company',
    'Group',
    'Location',
    'BankAccount',
    'CryptoAddress',
    'Device',
    'File',
    'MediaFile'
);


ALTER TYPE public.etc_entity_type_enum OWNER TO postgres;

--
-- Name: event_platform_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.event_platform_type_enum AS ENUM (
    'Google',
    'Apple',
    'Outlook',
    'Other'
);


ALTER TYPE public.event_platform_type_enum OWNER TO postgres;

--
-- Name: file_format_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.file_format_enum AS ENUM (
    'PDF',
    'DOCX',
    'TXT',
    'HTML',
    'Other'
);


ALTER TYPE public.file_format_enum OWNER TO postgres;

--
-- Name: file_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.file_type_enum AS ENUM (
    'Document',
    'Media'
);


ALTER TYPE public.file_type_enum OWNER TO postgres;

--
-- Name: finding_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.finding_status_enum AS ENUM (
    'SCANNED',
    'ACQUIRED',
    'Other'
);


ALTER TYPE public.finding_status_enum OWNER TO postgres;

--
-- Name: frequency_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.frequency_enum AS ENUM (
    'Hourly',
    'Daily',
    'Weekly',
    'Monthly',
    'ExactDateTime',
    'Custom'
);


ALTER TYPE public.frequency_enum OWNER TO postgres;

--
-- Name: fte_entity_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.fte_entity_type_enum AS ENUM (
    'PoI',
    'Company',
    'Group',
    'Location',
    'Case',
    'Device',
    'BankAccount',
    'CryptoAddress',
    'Event',
    'Post',
    'Web-Article',
    'Other'
);


ALTER TYPE public.fte_entity_type_enum OWNER TO postgres;

--
-- Name: gender_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_enum AS ENUM (
    'Male',
    'Female',
    'Lesbian',
    'Gay',
    'Queer',
    'Trans',
    'Non-Binary',
    'Intersex',
    'Genderfluid',
    'Agender',
    'Other'
);


ALTER TYPE public.gender_enum OWNER TO postgres;

--
-- Name: image_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.image_type_enum AS ENUM (
    'Album',
    'Document',
    'ProfileImage',
    'Content',
    'Post',
    'WebArticle',
    'Other'
);


ALTER TYPE public.image_type_enum OWNER TO postgres;

--
-- Name: import_method_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.import_method_enum AS ENUM (
    'FileUpload',
    'API',
    'Manual'
);


ALTER TYPE public.import_method_enum OWNER TO postgres;

--
-- Name: interest_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.interest_category_enum AS ENUM (
    'Arts & Culture',
    'Sports & Fitness',
    'Technology & Computing',
    'Science & Nature',
    'Business & Finance',
    'Education & Learning',
    'Health & Wellness',
    'Entertainment & Media',
    'Travel & Adventure',
    'Food & Cooking',
    'Fashion & Beauty',
    'Home & Garden',
    'Automotive',
    'Pets & Animals',
    'Politics & Government',
    'Religion & Spirituality',
    'Philanthropy & Volunteering',
    'History',
    'Literature & Writing',
    'Music',
    'Photography & Videography',
    'Gaming',
    'Collecting',
    'Crafts & DIY',
    'Social & Networking',
    'Environmental & Sustainability',
    'Professional & Career Development',
    'Personal Development',
    'Language & Linguistics',
    'Parenting & Family',
    'Film & Television',
    'Humor & Comedy',
    'Adventure Sports',
    'Mindfulness & Meditation',
    'Astrology & Mysticism',
    'Entrepreneurship',
    'Military & Defense',
    'Architecture & Design',
    'Law & Legal Issues',
    'Medical & Healthcare',
    'Public Speaking & Communication',
    'Data Science & Analytics',
    'Artificial Intelligence & Machine Learning',
    'Robotics',
    'Space Exploration',
    'Cryptocurrency & Blockchain',
    'Sustainability & Renewable Energy',
    'Other'
);


ALTER TYPE public.interest_category_enum OWNER TO postgres;

--
-- Name: interval_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.interval_type_enum AS ENUM (
    'Minutes',
    'Hours',
    'Days',
    'Weeks',
    'Months'
);


ALTER TYPE public.interval_type_enum OWNER TO postgres;

--
-- Name: label_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.label_enum AS ENUM (
    'ORG',
    'PERSON',
    'EVENT',
    'ORDINAL',
    'CARDINAL',
    'AMORPHOUS_TIME',
    'DATE',
    'PRODUCT',
    'LOC'
);


ALTER TYPE public.label_enum OWNER TO postgres;

--
-- Name: location_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.location_type_enum AS ENUM (
    'Residence',
    'Business',
    'Operational Base',
    'Other'
);


ALTER TYPE public.location_type_enum OWNER TO postgres;

--
-- Name: logical_operator_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.logical_operator_enum AS ENUM (
    'AND',
    'OR'
);


ALTER TYPE public.logical_operator_enum OWNER TO postgres;

--
-- Name: media_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.media_type_enum AS ENUM (
    'Audio',
    'Image',
    'Video'
);


ALTER TYPE public.media_type_enum OWNER TO postgres;

--
-- Name: message_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_type_enum AS ENUM (
    'TextMessage',
    'System',
    'MediaMessage',
    'PollMessage'
);


ALTER TYPE public.message_type_enum OWNER TO postgres;

--
-- Name: organization_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.organization_type_enum AS ENUM (
    'HQ',
    'Regional',
    'Branch'
);


ALTER TYPE public.organization_type_enum OWNER TO postgres;

--
-- Name: ownership_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ownership_role_enum AS ENUM (
    'Owner',
    'Lessee',
    'Lessor',
    'FleetManager',
    'Other'
);


ALTER TYPE public.ownership_role_enum OWNER TO postgres;

--
-- Name: phone_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.phone_type_enum AS ENUM (
    'Mobile',
    'Landline',
    'Fax',
    'VoIP',
    'Toll-Free',
    'Satellite',
    'Pager',
    'Emergency',
    'Short Code',
    'Other'
);


ALTER TYPE public.phone_type_enum OWNER TO postgres;

--
-- Name: platform_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.platform_type_enum AS ENUM (
    'Social Media',
    'News',
    'Search Engine',
    'Marketplace',
    'Other'
);


ALTER TYPE public.platform_type_enum OWNER TO postgres;

--
-- Name: priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.priority_enum AS ENUM (
    'Low',
    'Medium',
    'High',
    'Critical'
);


ALTER TYPE public.priority_enum OWNER TO postgres;

--
-- Name: record_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.record_status_enum AS ENUM (
    'DR',
    'AC',
    'DL',
    'HD',
    'AR'
);


ALTER TYPE public.record_status_enum OWNER TO postgres;

--
-- Name: relationship_source_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.relationship_source_enum AS ENUM (
    'Social',
    'Mobile',
    'Document',
    'Image',
    'Audio',
    'video',
    'Other'
);


ALTER TYPE public.relationship_source_enum OWNER TO postgres;

--
-- Name: relationship_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.relationship_type_enum AS ENUM (
    'General Contact',
    'Phone Contact',
    'Served Together',
    'Classmate',
    'Teammate',
    'Sibling',
    'Child',
    'Parent',
    'Spouse/Partner',
    'Follower',
    'Friend',
    'Neighbor',
    'Colleague',
    'Roommate',
    'Relative',
    'Phone Emergency Contact',
    'Known Associate'
);


ALTER TYPE public.relationship_type_enum OWNER TO postgres;

--
-- Name: reminder_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reminder_type_enum AS ENUM (
    'Popup',
    'Email',
    'Notification'
);


ALTER TYPE public.reminder_type_enum OWNER TO postgres;

--
-- Name: sentence_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sentence_type_enum AS ENUM (
    'statement',
    'question',
    'exclamation',
    'conditional',
    'other'
);


ALTER TYPE public.sentence_type_enum OWNER TO postgres;

--
-- Name: service_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_type_enum AS ENUM (
    'Voice',
    'SMS',
    'Data'
);


ALTER TYPE public.service_type_enum OWNER TO postgres;

--
-- Name: source_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.source_category_enum AS ENUM (
    'Social Media',
    'Financial Data',
    'Government Data',
    'News',
    'Other'
);


ALTER TYPE public.source_category_enum OWNER TO postgres;

--
-- Name: source_content_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.source_content_type_enum AS ENUM (
    'Document',
    'Post',
    'URL',
    'Email',
    'IM message',
    'Image-OCR',
    'Video-text',
    'Dark-Web',
    'Web-Article',
    'Other'
);


ALTER TYPE public.source_content_type_enum OWNER TO postgres;

--
-- Name: source_platform_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.source_platform_category_enum AS ENUM (
    'Entertainment',
    'Education',
    'Professional',
    'E-commerce',
    'Government',
    'Other'
);


ALTER TYPE public.source_platform_category_enum OWNER TO postgres;

--
-- Name: source_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.source_type_enum AS ENUM (
    'Database',
    'API',
    'File'
);


ALTER TYPE public.source_type_enum OWNER TO postgres;

--
-- Name: status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_enum AS ENUM (
    'Single',
    'Married',
    'Divorced',
    'Widowed',
    'In a Relationship',
    'Other'
);


ALTER TYPE public.status_enum OWNER TO postgres;

--
-- Name: study_mode_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.study_mode_enum AS ENUM (
    'Full-time',
    'Part-time',
    'Online',
    'Distance',
    'Other'
);


ALTER TYPE public.study_mode_enum OWNER TO postgres;

--
-- Name: system_source_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.system_source_type_enum AS ENUM (
    'Customer',
    'Internal'
);


ALTER TYPE public.system_source_type_enum OWNER TO postgres;

--
-- Name: text_analysis_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.text_analysis_status_enum AS ENUM (
    'NotStarted',
    'InQueue',
    'InProgress',
    'Error',
    'Completed'
);


ALTER TYPE public.text_analysis_status_enum OWNER TO postgres;

--
-- Name: text_analysis_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.text_analysis_type_enum AS ENUM (
    'Basic',
    'Extended'
);


ALTER TYPE public.text_analysis_type_enum OWNER TO postgres;

--
-- Name: transaction_channel_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_channel_enum AS ENUM (
    'Mobile',
    'Web',
    'ATM',
    'Branch',
    'Other'
);


ALTER TYPE public.transaction_channel_enum OWNER TO postgres;

--
-- Name: video_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.video_type_enum AS ENUM (
    'Album',
    'ProfileImage',
    'Content',
    'Post',
    'WebArticle',
    'Other'
);


ALTER TYPE public.video_type_enum OWNER TO postgres;

--
-- Name: visibility_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visibility_enum AS ENUM (
    'Public',
    'Private',
    'Confidential'
);


ALTER TYPE public.visibility_enum OWNER TO postgres;

--
-- Name: fn_document_content(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_document_content(p_file_id uuid) RETURNS TABLE(file_id uuid, document_id uuid, file_name text, file_format text, size_in_bytes bigint, summary text, creation_date timestamp without time zone, source_name text, title text, author text, total_pages integer, thumbnail text, total_data_points integer, document_data jsonb, topics jsonb)
    LANGUAGE sql STABLE
    AS $$
WITH doc_limited AS (
  SELECT
    bf.id AS file_id,
    d.base_file_id,
	  d.id AS document_id,
    bf.file_name,
    bf.mime_type AS file_format,
    bf.size_in_bytes,
    d.summary,
    bf.creation_date,
    s.source_name,
    d.title,
    d.author,
    d.total_pages,
    d.thumbnail,
    d.topics
  FROM document d
  JOIN base_file bf ON d.base_file_id = bf.id
  LEFT JOIN sparx_source_system s ON bf.source_id = s.id
  WHERE bf.id = p_file_id
),
paragraphs AS (
  SELECT
    dp.page_id AS paragraph_id,
    dp.loc,
    dp.text AS content,
    d.*
  FROM doc_limited d
  LEFT JOIN document_page dp ON dp.document_id = d.document_id
),
phrases_agg AS (
  SELECT
    ete.file_id,
    ete.source_content_id::text AS paragraph_id,
    jsonb_agg(
      jsonb_build_object(
        'text', np.text,
        'score', ete.value
      ) ORDER BY ete.value DESC
    ) AS phrases
  FROM enrichment_to_entity ete
  JOIN nlp_phrases np ON ete.enrichment_id = np.id
  JOIN doc_limited ON doc_limited.base_file_id = ete.file_id
  WHERE ete.enrichment_type = 'Phrases'
    AND ete.type = 'document'
  GROUP BY ete.file_id, ete.source_content_id
),
entities_agg AS (
  SELECT
    ete.file_id,
    ete.source_content_id::text AS paragraph_id,
    jsonb_agg(
      jsonb_build_object(
        'text', ne.text,
        'count', ete.value,
        'label', ne.label
      ) ORDER BY ete.value DESC
    ) AS entities
  FROM enrichment_to_entity ete
  JOIN nlp_entities ne ON ete.enrichment_id = ne.id
  JOIN doc_limited ON doc_limited.base_file_id = ete.file_id
  WHERE ete.enrichment_type = 'Entities'
    AND ete.type = 'document'
  GROUP BY ete.file_id, ete.source_content_id
),
common_words_agg AS (
  SELECT
    ete.file_id,
    ete.source_content_id::text AS paragraph_id,
    jsonb_agg(
      jsonb_build_object(
        'text', ncw.text,
        'count', ete.value
      ) ORDER BY ete.value DESC
    ) AS commonWords
  FROM enrichment_to_entity ete
  JOIN nlp_common_words ncw ON ete.enrichment_id = ncw.id
  JOIN doc_limited ON doc_limited.base_file_id = ete.file_id
  WHERE ete.enrichment_type = 'CommonWords'
    AND ete.type = 'document'
  GROUP BY ete.file_id, ete.source_content_id
),
paragraph_content_agg AS (
  SELECT
    d.base_file_id,
    jsonb_object_agg(dp.page_id, dp.text) AS paragraph_content
  FROM doc_limited d
  JOIN document_page dp ON dp.document_id = d.document_id
  GROUP BY d.base_file_id
)
SELECT
  p.base_file_id AS file_id,
  p.document_id,
  p.file_name,
  p.file_format,
  p.size_in_bytes,
  p.summary,
  p.creation_date,
  p.source_name,
  p.title,
  p.author,
  p.total_pages,
  p.thumbnail,
  (
    (SELECT count(*) FROM files_to_entities WHERE files_to_entities.entity_id = p.base_file_id) +
    (SELECT count(*) FROM language_to_entities WHERE language_to_entities.entity_id = p.base_file_id) +
    (SELECT count(*) FROM web_article_to_entities WHERE web_article_to_entities.entity_id::uuid = p.base_file_id) +
    (SELECT count(*) FROM location_to_entities WHERE location_to_entities.entity_id = p.base_file_id)
  ) AS total_data_points,
  jsonb_agg(
    jsonb_build_object(
      'loc', p.loc,
      'content', p.content,
      'source_id', p.paragraph_id,
      'nlp', jsonb_build_object(
        'phrases', COALESCE(pa.phrases, '[]'::jsonb),
        'entities', COALESCE(ea.entities, '[]'::jsonb),
        'commonWords', COALESCE(cwa.commonWords, '[]'::jsonb)
      )
    ) ORDER BY p.paragraph_id
  ) AS document_data,
  p.topics
FROM paragraphs p
LEFT JOIN phrases_agg pa
  ON pa.file_id = p.base_file_id AND pa.paragraph_id::uuid = p.paragraph_id
LEFT JOIN entities_agg ea
  ON ea.file_id = p.base_file_id AND ea.paragraph_id::uuid = p.paragraph_id
LEFT JOIN common_words_agg cwa
  ON cwa.file_id = p.base_file_id AND cwa.paragraph_id::uuid = p.paragraph_id
GROUP BY
  p.base_file_id, p.document_id, p.file_name, p.file_format, p.size_in_bytes,
  p.summary, p.creation_date, p.source_name, p.thumbnail,
  p.title, p.author, p.total_pages, p.topics
$$;


ALTER FUNCTION public.fn_document_content(p_file_id uuid) OWNER TO postgres;

--
-- Name: fn_document_contents(uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_document_contents(p_file_id uuid[]) RETURNS TABLE(file_id uuid, document_id uuid, file_name text, file_format text, size_in_bytes bigint, summary text, creation_date timestamp without time zone, source_name text, title text, author text, total_pages integer, thumbnail text, total_data_points integer, document_data jsonb, topics jsonb)
    LANGUAGE sql STABLE
    AS $$
WITH doc_limited AS (
  SELECT
    bf.id AS file_id,
    d.base_file_id,
	  d.id AS document_id,
    bf.file_name,
    bf.mime_type AS file_format,
    bf.size_in_bytes,
    d.summary,
    bf.creation_date,
    s.source_name,
    d.title,
    d.author,
    d.total_pages,
    d.thumbnail,
    d.topics
  FROM document d
  JOIN base_file bf ON d.base_file_id = bf.id
  LEFT JOIN sparx_source_system s ON bf.source_id = s.id
  WHERE bf.id = ANY(p_file_id)
),
paragraphs AS (
  SELECT
    dp.page_id AS paragraph_id,
    dp.loc,
    dp.text AS content,
    d.*
  FROM doc_limited d
  LEFT JOIN document_page dp ON dp.document_id = d.document_id
),
phrases_agg AS (
  SELECT
    ete.file_id,
    ete.source_content_id::text AS paragraph_id,
    jsonb_agg(
      jsonb_build_object(
        'text', np.text,
        'score', ete.value
      ) ORDER BY ete.value DESC
    ) AS phrases
  FROM enrichment_to_entity ete
  JOIN nlp_phrases np ON ete.enrichment_id = np.id
  JOIN doc_limited ON doc_limited.base_file_id = ete.file_id
  WHERE ete.enrichment_type = 'Phrases'
    AND ete.type = 'document'
  GROUP BY ete.file_id, ete.source_content_id
),
entities_agg AS (
  SELECT
    ete.file_id,
    ete.source_content_id::text AS paragraph_id,
    jsonb_agg(
      jsonb_build_object(
        'text', ne.text,
        'count', ete.value,
        'label', ne.label
      ) ORDER BY ete.value DESC
    ) AS entities
  FROM enrichment_to_entity ete
  JOIN nlp_entities ne ON ete.enrichment_id = ne.id
  JOIN doc_limited ON doc_limited.base_file_id = ete.file_id
  WHERE ete.enrichment_type = 'Entities'
    AND ete.type = 'document'
  GROUP BY ete.file_id, ete.source_content_id
),
common_words_agg AS (
  SELECT
    ete.file_id,
    ete.source_content_id::text AS paragraph_id,
    jsonb_agg(
      jsonb_build_object(
        'text', ncw.text,
        'count', ete.value
      ) ORDER BY ete.value DESC
    ) AS commonWords
  FROM enrichment_to_entity ete
  JOIN nlp_common_words ncw ON ete.enrichment_id = ncw.id
  JOIN doc_limited ON doc_limited.base_file_id = ete.file_id
  WHERE ete.enrichment_type = 'CommonWords'
    AND ete.type = 'document'
  GROUP BY ete.file_id, ete.source_content_id
),
paragraph_content_agg AS (
  SELECT
    d.base_file_id,
    jsonb_object_agg(dp.page_id, dp.text) AS paragraph_content
  FROM doc_limited d
  JOIN document_page dp ON dp.document_id = d.document_id
  GROUP BY d.base_file_id
)
SELECT
  p.base_file_id AS file_id,
  p.document_id,
  p.file_name,
  p.file_format,
  p.size_in_bytes,
  p.summary,
  p.creation_date,
  p.source_name,
  p.title,
  p.author,
  p.total_pages,
  p.thumbnail,
  (
    (SELECT count(*) FROM files_to_entities WHERE files_to_entities.entity_id = p.base_file_id) +
    (SELECT count(*) FROM language_to_entities WHERE language_to_entities.entity_id = p.base_file_id) +
    (SELECT count(*) FROM web_article_to_entities WHERE web_article_to_entities.entity_id::uuid = p.base_file_id) +
    (SELECT count(*) FROM location_to_entities WHERE location_to_entities.entity_id = p.base_file_id)
  ) AS total_data_points,
  jsonb_agg(
    jsonb_build_object(
      'loc', p.loc,
      'content', p.content,
      'source_id', p.paragraph_id,
      'nlp', jsonb_build_object(
        'phrases', COALESCE(pa.phrases, '[]'::jsonb),
        'entities', COALESCE(ea.entities, '[]'::jsonb),
        'commonWords', COALESCE(cwa.commonWords, '[]'::jsonb)
      )
    ) ORDER BY p.paragraph_id
  ) AS document_data,
  p.topics
FROM paragraphs p
LEFT JOIN phrases_agg pa
  ON pa.file_id = p.base_file_id AND pa.paragraph_id::uuid = p.paragraph_id
LEFT JOIN entities_agg ea
  ON ea.file_id = p.base_file_id AND ea.paragraph_id::uuid = p.paragraph_id
LEFT JOIN common_words_agg cwa
  ON cwa.file_id = p.base_file_id AND cwa.paragraph_id::uuid = p.paragraph_id
GROUP BY
  p.base_file_id, p.document_id, p.file_name, p.file_format, p.size_in_bytes,
  p.summary, p.creation_date, p.source_name, p.thumbnail,
  p.title, p.author, p.total_pages, p.topics
$$;


ALTER FUNCTION public.fn_document_contents(p_file_id uuid[]) OWNER TO postgres;

--
-- Name: refresh_mv_posts_articles_all(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_mv_posts_articles_all() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE NOTICE 'Refreshing sentiment aggregates...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sentiment_aggregates;

    RAISE NOTICE 'Refreshing NLP entities...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_nlp_entities_agg;

    RAISE NOTICE 'Refreshing NLP words...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_nlp_words_agg;

    RAISE NOTICE 'Refreshing NLP phrases...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_nlp_phrases_agg;

    RAISE NOTICE 'Refreshing media files...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_media_files_agg;

    RAISE NOTICE 'Refreshing source content base...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_source_content_base;

    RAISE NOTICE 'Refreshing main posts/articles view...';
    REFRESH MATERIALIZED VIEW mv_posts_articles;

    RAISE NOTICE 'All views refreshed successfully!';
END;
$$;


ALTER FUNCTION public.refresh_mv_posts_articles_all() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts_to_entities (
    id uuid NOT NULL,
    account_id uuid,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.accounts_to_entities OWNER TO postgres;

--
-- Name: base_file; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.base_file (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    creation_date timestamp without time zone,
    download_link text,
    file_name text,
    file_path text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    major_language uuid,
    mime_type text,
    poi_id uuid,
    size_in_bytes integer,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    unique_content_id text
);


ALTER TABLE public.base_file OWNER TO postgres;

--
-- Name: case; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."case" (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    description text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    name text,
    poi_id uuid,
    priority public.priority_enum,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    status public.status_enum
);


ALTER TABLE public."case" OWNER TO postgres;

--
-- Name: company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company (
    id uuid NOT NULL,
    business_status public.business_status_enum,
    ceo text,
    company_logo text,
    company_name text,
    company_type public.company_type_enum,
    created_at timestamp without time zone,
    created_by uuid,
    headquarters_location uuid,
    incorporation_date date,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    notes jsonb,
    number_of_employees integer,
    parent_company uuid,
    poi_id uuid,
    registration_number text,
    social_media_profiles jsonb,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    subsidiaries jsonb,
    website text
);


ALTER TABLE public.company OWNER TO postgres;

--
-- Name: company_to_poi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_to_poi (
    id uuid NOT NULL,
    company_id uuid,
    created_at timestamp without time zone,
    created_by uuid,
    date uuid,
    department text,
    employment_type public.employment_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    linked_in_profile_id uuid,
    poi_id uuid,
    role text,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    source_platform_id text
);


ALTER TABLE public.company_to_poi OWNER TO postgres;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    iso2_char_code text,
    iso3_char_code text,
    iso_country_code text,
    iso_country_name text,
    iso_official_state_name text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: country_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.country_to_entities (
    id uuid NOT NULL,
    country_id uuid,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.country_to_entities OWNER TO postgres;

--
-- Name: date; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.date (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    date_type public.date_type_enum,
    date_value timestamp without time zone,
    date_value_style text,
    end_date timestamp without time zone,
    end_date_style text,
    entity_id uuid,
    entity_type public.entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    start_date timestamp without time zone,
    start_date_style text
);


ALTER TABLE public.date OWNER TO postgres;

--
-- Name: document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document (
    id uuid NOT NULL,
    ai_summary text,
    assigned_to jsonb,
    author text,
    base_file_id uuid,
    content jsonb,
    created_at timestamp without time zone,
    created_by uuid,
    device_contact_id text,
    device_id uuid,
    device_profile_id uuid,
    device_raw_contact_id text,
    document_origin public.document_origin_enum,
    document_type public.document_type_enum,
    effective_date date,
    expiry_date date,
    file_format public.file_format_enum,
    last_approved_at timestamp without time zone,
    last_approved_by uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    legacy_nlp_analysis boolean,
    notes jsonb,
    notes_item_content text,
    notes_item_date timestamp without time zone,
    notes_item_user_id uuid,
    poi_id uuid,
    record_status public.record_status_enum,
    schema_version uuid,
    sentiment_analysis boolean,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    summary jsonb,
    tags jsonb,
    title text,
    topics jsonb,
    total_pages integer,
    page_ids uuid[],
    thumbnail text
);


ALTER TABLE public.document OWNER TO postgres;

--
-- Name: document_page; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_page (
    document_id uuid NOT NULL,
    page_id uuid NOT NULL,
    text text,
    loc text
);


ALTER TABLE public.document_page OWNER TO postgres;

--
-- Name: education_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.education_history (
    id uuid NOT NULL,
    awards_and_honors jsonb,
    certifications jsonb,
    created_at timestamp without time zone,
    created_by uuid,
    date uuid,
    degree public.degree_enum,
    gpa integer,
    grade text,
    image text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    location uuid,
    poi_id uuid,
    scholarship text,
    school text,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    study_field text,
    study_mode public.study_mode_enum,
    url text
);


ALTER TABLE public.education_history OWNER TO postgres;

--
-- Name: email; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email (
    id uuid NOT NULL,
    account_id text,
    created_at timestamp without time zone,
    created_by uuid,
    email_value text,
    finding_status public.finding_status_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    scanning_time timestamp without time zone,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.email OWNER TO postgres;

--
-- Name: email_address_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_address_to_entities (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    email_address_entity_type public.email_address_entity_type_enum,
    email_address_id uuid,
    entity_id uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    link_date uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.email_address_to_entities OWNER TO postgres;

--
-- Name: enrichment_to_entity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrichment_to_entity (
    id integer NOT NULL,
    source_content_id uuid NOT NULL,
    type text NOT NULL,
    file_id uuid,
    enrichment_id integer NOT NULL,
    enrichment_type text NOT NULL,
    numeric_label text NOT NULL,
    value double precision NOT NULL
);


ALTER TABLE public.enrichment_to_entity OWNER TO postgres;

--
-- Name: enrichment_to_entity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrichment_to_entity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrichment_to_entity_id_seq OWNER TO postgres;

--
-- Name: enrichment_to_entity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrichment_to_entity_id_seq OWNED BY public.enrichment_to_entity.id;


--
-- Name: files_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.files_to_entities (
    id uuid NOT NULL,
    association_type public.association_type_enum,
    count integer,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    file_id uuid,
    file_type public.file_type_enum,
    fte_entity_type public.fte_entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    link_date uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    tags jsonb
);


ALTER TABLE public.files_to_entities OWNER TO postgres;

--
-- Name: gender; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gender (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    gender public.gender_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.gender OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id uuid NOT NULL,
    aliases jsonb,
    created_at timestamp without time zone,
    created_by uuid,
    group_name text,
    known_activities jsonb,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    locations_of_operation jsonb,
    number_of_members integer,
    poi_id uuid,
    primary_bank_account uuid,
    primary_crypto_address uuid,
    primary_email uuid,
    primary_location uuid,
    primary_profile_image uuid,
    primary_url uuid,
    recent_media_mentions_posts jsonb,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    type_category jsonb
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: industry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.industry (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    description text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    name text
);


ALTER TABLE public.industry OWNER TO postgres;

--
-- Name: industry_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.industry_to_entities (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    industry_id uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.industry_to_entities OWNER TO postgres;

--
-- Name: interest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interest (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    description text,
    interest_category public.interest_category_enum,
    interest_name text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid
);


ALTER TABLE public.interest OWNER TO postgres;

--
-- Name: interest_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interest_to_entities (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    interest_id uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.interest_to_entities OWNER TO postgres;

--
-- Name: knex_migrations_locations_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knex_migrations_locations_service (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations_locations_service OWNER TO postgres;

--
-- Name: knex_migrations_locations_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knex_migrations_locations_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_locations_service_id_seq OWNER TO postgres;

--
-- Name: knex_migrations_locations_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knex_migrations_locations_service_id_seq OWNED BY public.knex_migrations_locations_service.id;


--
-- Name: knex_migrations_locations_service_lock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knex_migrations_locations_service_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_locations_service_lock OWNER TO postgres;

--
-- Name: knex_migrations_locations_service_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knex_migrations_locations_service_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_locations_service_lock_index_seq OWNER TO postgres;

--
-- Name: knex_migrations_locations_service_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knex_migrations_locations_service_lock_index_seq OWNED BY public.knex_migrations_locations_service_lock.index;


--
-- Name: language; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.language (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    iso2_char_code text,
    iso3_char_code text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    name text,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.language OWNER TO postgres;

--
-- Name: language_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.language_to_entities (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    language_id uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.language_to_entities OWNER TO postgres;

--
-- Name: lenz_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lenz_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    base_file_id uuid NOT NULL,
    metadata jsonb,
    sample_filename text,
    sample_total_objects integer,
    all_objects jsonb,
    country text,
    object_classes jsonb,
    max_confidence_name text,
    max_confidence double precision,
    bounding_box jsonb
);


ALTER TABLE public.lenz_data OWNER TO postgres;

--
-- Name: location; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location (
    id uuid NOT NULL,
    altitude integer,
    apartment text,
    bearing integer,
    city text,
    country uuid,
    created_at timestamp without time zone,
    created_by uuid,
    formatted_address text,
    house_number text,
    iso2_char_code text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    lat numeric(15,4),
    location_type public.location_type_enum,
    long numeric(15,4),
    po_box text,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    speed integer,
    state text,
    street text,
    zip text
);


ALTER TABLE public.location OWNER TO postgres;

--
-- Name: location_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_to_entities (
    id uuid NOT NULL,
    captured_by text,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type text,
    event_timestamp timestamp without time zone,
    event_timestamp_value_style text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    location_id uuid,
    poi_id uuid,
    relationship_source public.relationship_source_enum,
    relationship_type public.relationship_type_enum,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    timezone_offset interval
);


ALTER TABLE public.location_to_entities OWNER TO postgres;

--
-- Name: sparx_source_system; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sparx_source_system (
    id uuid NOT NULL,
    api_key_required boolean,
    authentication_method public.authentication_method_enum,
    created_at timestamp without time zone,
    created_by uuid,
    data_format public.data_format_enum,
    data_refresh_rate public.data_refresh_rate_enum,
    file_path text,
    import_method public.import_method_enum,
    is_active boolean,
    last_sync_date timestamp without time zone,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    source_category public.source_category_enum,
    source_description text,
    source_name text,
    source_url text,
    system_source_type public.system_source_type_enum
);


ALTER TABLE public.sparx_source_system OWNER TO postgres;

--
-- Name: location_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.location_view AS
 SELECT loc.id,
    loc.altitude,
    loc.apartment,
    loc.bearing,
    loc.city,
    c.iso_country_name AS country,
    loc.created_at,
    loc.created_by,
    loc.formatted_address,
    loc.house_number,
    loc.iso2_char_code,
    loc.last_updated_at,
    loc.last_updated_by,
    loc.lat,
    loc.location_type,
    loc.long,
    loc.po_box,
    loc.poi_id,
    loc.source_id,
    loc.source_item_id,
    loc.source_platform,
    loc.speed,
    loc.state,
    loc.street,
    loc.zip,
    lte.entity_id,
    s.source_name,
    ( SELECT (count(*))::integer AS count
           FROM public.location_to_entities lte_1
          WHERE (lte_1.location_id = loc.id)) AS entities_count
   FROM (((public.location loc
     LEFT JOIN public.location_to_entities lte ON ((lte.location_id = loc.id)))
     LEFT JOIN public.sparx_source_system s ON ((s.id = loc.source_id)))
     LEFT JOIN public.countries c ON ((c.id = loc.country)));


ALTER VIEW public.location_view OWNER TO postgres;

--
-- Name: name_to_poi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.name_to_poi (
    id uuid NOT NULL,
    alias text,
    created_at timestamp without time zone,
    created_by uuid,
    first_name text,
    last_name text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    middle_name text,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    full_name text GENERATED ALWAYS AS (TRIM(BOTH FROM ((COALESCE(first_name, ''::text) ||
CASE
    WHEN ((middle_name IS NOT NULL) AND (middle_name <> ''::text)) THEN (' '::text || middle_name)
    ELSE ''::text
END) ||
CASE
    WHEN ((last_name IS NOT NULL) AND (last_name <> ''::text)) THEN (' '::text || last_name)
    ELSE ''::text
END))) STORED
);


ALTER TABLE public.name_to_poi OWNER TO postgres;

--
-- Name: person_of_interest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.person_of_interest (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    description text,
    favorite_by jsonb,
    home_country uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    notes jsonb,
    poi_id uuid,
    primary_app uuid,
    primary_bank_account uuid,
    primary_career_location uuid,
    primary_crypto_address uuid,
    primary_deceased_date uuid,
    primary_device uuid,
    primary_dob uuid,
    primary_email uuid,
    primary_gender uuid,
    primary_group uuid,
    primary_interest uuid,
    primary_language uuid,
    primary_location uuid,
    primary_name uuid,
    primary_nationality uuid,
    primary_organization uuid,
    primary_personal_status uuid,
    primary_profile_image uuid,
    primary_url uuid,
    primary_user_name uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.person_of_interest OWNER TO postgres;

--
-- Name: personal_status_to_poi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_status_to_poi (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    status public.status_enum
);


ALTER TABLE public.personal_status_to_poi OWNER TO postgres;

--
-- Name: phone_number; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phone_number (
    id uuid NOT NULL,
    account_id text,
    country uuid,
    created_at timestamp without time zone,
    created_by uuid,
    extension text,
    finding_status public.finding_status_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    mobile_carrier text,
    original_value text,
    phone_type public.phone_type_enum,
    poi_id uuid,
    sanitized_value text,
    scanning_time timestamp without time zone,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.phone_number OWNER TO postgres;

--
-- Name: phone_number_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phone_number_to_entities (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    phone_number_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.phone_number_to_entities OWNER TO postgres;

--
-- Name: url; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.url (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    finding_status public.finding_status_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    scanning_time timestamp without time zone,
    secondary_user_name text,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    user_name text,
    value text
);


ALTER TABLE public.url OWNER TO postgres;

--
-- Name: user_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_accounts (
    id uuid NOT NULL,
    about text,
    additional_data text,
    alias text,
    created_at timestamp without time zone,
    created_by uuid,
    details text,
    display_name text,
    email text,
    extracted_from_content_type text,
    last_played timestamp without time zone,
    last_seen timestamp without time zone,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    location uuid,
    password text,
    phone text,
    poi_id uuid,
    profile_image uuid,
    registration_date timestamp without time zone,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    source_url text,
    title text,
    tokens text,
    user_id text,
    user_name text
);


ALTER TABLE public.user_accounts OWNER TO postgres;

--
-- Name: mv_person_of_interest_details; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_person_of_interest_details AS
 WITH name_lookup AS (
         SELECT name_to_poi.id,
            name_to_poi.first_name,
            name_to_poi.middle_name,
            name_to_poi.last_name,
            name_to_poi.alias
           FROM public.name_to_poi
          WHERE (name_to_poi.id IN ( SELECT DISTINCT person_of_interest.primary_name
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_name IS NOT NULL)))
        ), date_lookup AS (
         SELECT date.id,
            date.date_value
           FROM public.date
          WHERE (date.id IN ( SELECT DISTINCT person_of_interest.primary_dob
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_dob IS NOT NULL)))
        ), user_lookup AS (
         SELECT user_accounts.id,
            user_accounts.user_name,
            user_accounts.alias
           FROM public.user_accounts
          WHERE (user_accounts.id IN ( SELECT DISTINCT person_of_interest.primary_user_name
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_user_name IS NOT NULL)))
        ), gender_lookup AS (
         SELECT gender.id,
            gender.gender
           FROM public.gender
          WHERE (gender.id IN ( SELECT DISTINCT person_of_interest.primary_gender
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_gender IS NOT NULL)))
        ), email_lookup AS (
         SELECT email.id,
            email.email_value
           FROM public.email
          WHERE (email.id IN ( SELECT DISTINCT person_of_interest.primary_email
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_email IS NOT NULL)))
        ), location_lookup AS (
         SELECT location.id,
            location.iso2_char_code,
            location.city,
            location.street,
            location.formatted_address
           FROM public.location
          WHERE (location.id IN ( SELECT DISTINCT person_of_interest.primary_location
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_location IS NOT NULL)))
        ), interest_lookup AS (
         SELECT interest.id,
            interest.interest_name
           FROM public.interest
          WHERE (interest.id IN ( SELECT DISTINCT person_of_interest.primary_interest
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_interest IS NOT NULL)))
        ), personal_status_lookup AS (
         SELECT personal_status_to_poi.id,
            personal_status_to_poi.status
           FROM public.personal_status_to_poi
          WHERE (personal_status_to_poi.id IN ( SELECT DISTINCT person_of_interest.primary_personal_status
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_personal_status IS NOT NULL)))
        ), language_lookup AS (
         SELECT language.id,
            language.name
           FROM public.language
          WHERE (language.id IN ( SELECT DISTINCT person_of_interest.primary_language
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_language IS NOT NULL)))
        ), url_lookup AS (
         SELECT url_1.id,
            url_1.value
           FROM public.url url_1
          WHERE (url_1.id IN ( SELECT DISTINCT person_of_interest.primary_url
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_url IS NOT NULL)))
        ), phone_lookup AS (
         SELECT phone_number.id,
            phone_number.sanitized_value
           FROM public.phone_number
          WHERE (phone_number.id IN ( SELECT DISTINCT person_of_interest.primary_device
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_device IS NOT NULL)))
        ), file_lookup AS (
         SELECT base_file.id,
            base_file.file_name
           FROM public.base_file
          WHERE (base_file.id IN ( SELECT DISTINCT person_of_interest.primary_profile_image
                   FROM public.person_of_interest
                  WHERE (person_of_interest.primary_profile_image IS NOT NULL)))
        ), source_lookup AS (
         SELECT sparx_source_system.id,
            sparx_source_system.source_name
           FROM public.sparx_source_system
          WHERE (sparx_source_system.id IN ( SELECT DISTINCT person_of_interest.source_id
                   FROM public.person_of_interest
                  WHERE (person_of_interest.source_id IS NOT NULL)))
        ), data_points_summary AS (
         SELECT counts.poi_id,
            (((((((((((sum(
                CASE
                    WHEN (counts.table_name = 'name_to_poi'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END) + sum(
                CASE
                    WHEN (counts.table_name = 'date'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'accounts_to_entities'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'email'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'location_to_entities'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'country_to_entities'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'interest_to_entities'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'personal_status_to_poi'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'language'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'url'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'phone_number_to_entities'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) + sum(
                CASE
                    WHEN (counts.table_name = 'company_to_poi'::text) THEN counts.cnt
                    ELSE (0)::bigint
                END)) AS total_data_points
           FROM ( SELECT name_to_poi.poi_id,
                    count(*) AS cnt,
                    'name_to_poi'::text AS table_name
                   FROM public.name_to_poi
                  GROUP BY name_to_poi.poi_id
                UNION ALL
                 SELECT date.poi_id,
                    count(*) AS count,
                    'date'::text AS text
                   FROM public.date
                  GROUP BY date.poi_id
                UNION ALL
                 SELECT accounts_to_entities.entity_id,
                    count(*) AS count,
                    'accounts_to_entities'::text AS text
                   FROM public.accounts_to_entities
                  GROUP BY accounts_to_entities.entity_id
                UNION ALL
                 SELECT email.poi_id,
                    count(*) AS count,
                    'email'::text AS text
                   FROM public.email
                  GROUP BY email.poi_id
                UNION ALL
                 SELECT location_to_entities.entity_id,
                    count(*) AS count,
                    'location_to_entities'::text AS text
                   FROM public.location_to_entities
                  GROUP BY location_to_entities.entity_id
                UNION ALL
                 SELECT country_to_entities.entity_id,
                    count(*) AS count,
                    'country_to_entities'::text AS text
                   FROM public.country_to_entities
                  GROUP BY country_to_entities.entity_id
                UNION ALL
                 SELECT interest_to_entities.entity_id,
                    count(*) AS count,
                    'interest_to_entities'::text AS text
                   FROM public.interest_to_entities
                  GROUP BY interest_to_entities.entity_id
                UNION ALL
                 SELECT personal_status_to_poi.poi_id,
                    count(*) AS count,
                    'personal_status_to_poi'::text AS text
                   FROM public.personal_status_to_poi
                  GROUP BY personal_status_to_poi.poi_id
                UNION ALL
                 SELECT language.poi_id,
                    count(*) AS count,
                    'language'::text AS text
                   FROM public.language
                  GROUP BY language.poi_id
                UNION ALL
                 SELECT url_1.poi_id,
                    count(*) AS count,
                    'url'::text AS text
                   FROM public.url url_1
                  GROUP BY url_1.poi_id
                UNION ALL
                 SELECT phone_number_to_entities.entity_id,
                    count(*) AS count,
                    'phone_number_to_entities'::text AS text
                   FROM public.phone_number_to_entities
                  GROUP BY phone_number_to_entities.entity_id
                UNION ALL
                 SELECT company_to_poi.poi_id,
                    count(*) AS count,
                    'company_to_poi'::text AS text
                   FROM public.company_to_poi
                  GROUP BY company_to_poi.poi_id) counts
          GROUP BY counts.poi_id
        ), fallback_locations AS (
         SELECT DISTINCT ON (poi_1.id) poi_1.id,
            loc.city AS fallback_city,
            loc.street AS fallback_street,
            loc.formatted_address AS fallback_formatted_address
           FROM ((public.person_of_interest poi_1
             JOIN public.location_to_entities lte ON ((lte.entity_id = poi_1.id)))
             JOIN public.location loc ON ((loc.id = lte.location_id)))
          WHERE ((poi_1.primary_location IS NULL) AND ((loc.formatted_address IS NOT NULL) OR (loc.city IS NOT NULL) OR (loc.iso2_char_code IS NOT NULL)))
          ORDER BY poi_1.id, (loc.formatted_address IS NOT NULL) DESC, (loc.city IS NOT NULL) DESC, (loc.iso2_char_code IS NOT NULL) DESC
        ), home_countries AS (
         SELECT c2e.id,
            co.iso_country_name
           FROM (public.country_to_entities c2e
             JOIN public.countries co ON ((co.id = c2e.country_id)))
          WHERE (c2e.id IN ( SELECT DISTINCT person_of_interest.home_country
                   FROM public.person_of_interest
                  WHERE (person_of_interest.home_country IS NOT NULL)))
        )
 SELECT poi.id,
    poi.created_at,
    poi.created_by,
    poi.description,
    poi.favorite_by,
    hc.iso_country_name AS home_country,
    poi.last_updated_at,
    poi.last_updated_by,
    poi.notes,
    poi.poi_id,
    poi.primary_app,
    poi.primary_bank_account,
    poi.primary_career_location,
    poi.primary_crypto_address,
    poi.primary_deceased_date,
    poi.primary_device,
    poi.primary_dob,
    poi.primary_email,
    poi.primary_gender,
    poi.primary_group,
    poi.primary_interest,
    poi.primary_language,
    poi.primary_location,
    poi.primary_name,
    poi.primary_nationality,
    poi.primary_organization,
    poi.primary_personal_status,
    poi.primary_profile_image,
    poi.primary_url,
    poi.primary_user_name,
    poi.source_id,
    poi.source_item_id,
    poi.source_platform,
    n.first_name,
    n.middle_name,
    n.last_name,
    n.alias,
    d.date_value AS date_of_birth,
    u.user_name AS username,
    u.alias AS user_alias,
    g.gender,
    e.email_value AS email,
    l.iso2_char_code AS country,
    COALESCE(l.city, fl.fallback_city) AS city,
    COALESCE(l.street, fl.fallback_street) AS street,
    COALESCE(l.formatted_address, fl.fallback_formatted_address) AS formatted_address,
    i.interest_name AS interest,
    ps.status AS personal_status,
    lang.name AS language,
    url.value AS url,
    p.sanitized_value AS phone_number,
    bf.file_name AS profile_image_name,
    s.source_name AS source,
    COALESCE(dps.total_data_points, (0)::numeric) AS total_data_points
   FROM ((((((((((((((((public.person_of_interest poi
     LEFT JOIN name_lookup n ON ((n.id = poi.primary_name)))
     LEFT JOIN date_lookup d ON ((d.id = poi.primary_dob)))
     LEFT JOIN user_lookup u ON ((u.id = poi.primary_user_name)))
     LEFT JOIN gender_lookup g ON ((g.id = poi.primary_gender)))
     LEFT JOIN email_lookup e ON ((e.id = poi.primary_email)))
     LEFT JOIN location_lookup l ON ((l.id = poi.primary_location)))
     LEFT JOIN fallback_locations fl ON ((fl.id = poi.id)))
     LEFT JOIN interest_lookup i ON ((i.id = poi.primary_interest)))
     LEFT JOIN personal_status_lookup ps ON ((ps.id = poi.primary_personal_status)))
     LEFT JOIN language_lookup lang ON ((lang.id = poi.primary_language)))
     LEFT JOIN url_lookup url ON ((url.id = poi.primary_url)))
     LEFT JOIN phone_lookup p ON ((p.id = poi.primary_device)))
     LEFT JOIN file_lookup bf ON ((bf.id = poi.primary_profile_image)))
     LEFT JOIN source_lookup s ON ((s.id = poi.source_id)))
     LEFT JOIN home_countries hc ON ((hc.id = poi.home_country)))
     LEFT JOIN data_points_summary dps ON ((dps.poi_id = poi.id)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_person_of_interest_details OWNER TO postgres;

--
-- Name: location_view_geo; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.location_view_geo AS
 SELECT l.poi_id,
    concat_ws(' '::text,
        CASE
            WHEN (mv.first_name = 'None'::text) THEN ''::text
            ELSE mv.first_name
        END,
        CASE
            WHEN (mv.middle_name = 'None'::text) THEN ''::text
            ELSE mv.middle_name
        END,
        CASE
            WHEN (mv.last_name = 'None'::text) THEN ''::text
            ELSE mv.last_name
        END) AS name,
    l.lat,
    l.long,
    l.formatted_address AS "formattedAddress",
    l.location_type AS "locationType",
    l.id
   FROM (public.location l
     LEFT JOIN public.mv_person_of_interest_details mv ON ((mv.id = l.poi_id)));


ALTER VIEW public.location_view_geo OWNER TO postgres;

--
-- Name: mv_company; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_company AS
 WITH company_data_points AS (
         SELECT c.id,
            count(ate.entity_id) AS account_count,
            count(eat.entity_id) AS email_count,
            count(lte.entity_id) AS location_count,
            count(ite.entity_id) AS interest_count,
            count(inde.entity_id) AS industry_count,
            count(pnte.entity_id) AS phone_count,
            count(ctp.company_id) AS poi_count
           FROM (((((((public.company c
             LEFT JOIN public.accounts_to_entities ate ON ((ate.entity_id = c.id)))
             LEFT JOIN public.email_address_to_entities eat ON ((eat.entity_id = c.id)))
             LEFT JOIN public.location_to_entities lte ON ((lte.entity_id = c.id)))
             LEFT JOIN public.interest_to_entities ite ON ((ite.entity_id = c.id)))
             LEFT JOIN public.industry_to_entities inde ON ((inde.entity_id = c.id)))
             LEFT JOIN public.phone_number_to_entities pnte ON ((pnte.entity_id = c.id)))
             LEFT JOIN public.company_to_poi ctp ON ((ctp.company_id = c.id)))
          GROUP BY c.id
        ), company_with_first_relationships AS (
         SELECT DISTINCT ON (c.id) c.id,
            c.business_status,
            c.ceo,
            c.company_logo,
            c.company_name,
            c.company_type,
            c.created_at,
            c.created_by,
            c.headquarters_location,
            c.incorporation_date,
            c.last_updated_at,
            c.last_updated_by,
            c.number_of_employees,
            c.parent_company,
            c.poi_id,
            c.registration_number,
            c.social_media_profiles,
            c.source_id,
            c.source_item_id,
            c.source_platform,
            c.subsidiaries,
            c.website,
            c.notes,
            e.email_value AS email,
            s.source_name AS source,
            COALESCE(l.formatted_address, l.city, cu.iso_country_name) AS company_address
           FROM ((((((public.company c
             LEFT JOIN public.sparx_source_system s ON ((s.id = c.source_id)))
             LEFT JOIN public.location_to_entities lte ON ((lte.entity_id = c.id)))
             LEFT JOIN public.location l ON ((l.id = lte.location_id)))
             LEFT JOIN public.countries cu ON ((cu.id = l.country)))
             LEFT JOIN public.email_address_to_entities eat ON ((eat.entity_id = c.id)))
             LEFT JOIN public.email e ON ((e.id = eat.email_address_id)))
        )
 SELECT cwr.id,
    cwr.business_status,
    cwr.ceo,
    cwr.company_logo,
    cwr.company_name,
    cwr.company_type,
    cwr.created_at,
    cwr.created_by,
    cwr.headquarters_location,
    cwr.incorporation_date,
    cwr.last_updated_at,
    cwr.last_updated_by,
    cwr.number_of_employees,
    cwr.parent_company,
    cwr.poi_id,
    cwr.registration_number,
    cwr.social_media_profiles,
    cwr.source_id,
    cwr.source_item_id,
    cwr.source_platform,
    cwr.subsidiaries,
    cwr.website,
    cwr.notes,
    cwr.email,
    cwr.source,
    cwr.company_address,
    (((((((cdp.account_count + cdp.email_count) + cdp.location_count) + cdp.interest_count) + cdp.industry_count) + cdp.phone_count) + cdp.poi_count))::integer AS total_data_points
   FROM (company_with_first_relationships cwr
     LEFT JOIN company_data_points cdp ON ((cdp.id = cwr.id)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_company OWNER TO postgres;

--
-- Name: mv_location; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_location AS
 SELECT loc.id,
    loc.altitude,
    loc.apartment,
    loc.bearing,
    loc.city,
    c.iso_country_name AS country,
    loc.created_at,
    loc.created_by,
    loc.formatted_address,
    loc.house_number,
    loc.iso2_char_code,
    loc.last_updated_at,
    loc.last_updated_by,
    loc.lat,
    loc.location_type,
    loc.long,
    loc.po_box,
    loc.poi_id,
    loc.source_id,
    loc.source_item_id,
    loc.source_platform,
    loc.speed,
    loc.state,
    loc.street,
    loc.zip,
    lte.entity_id,
    s.source_name,
    ( SELECT (count(*))::integer AS count
           FROM public.location_to_entities lte_1
          WHERE (lte_1.location_id = loc.id)) AS entities_count
   FROM (((public.location loc
     LEFT JOIN public.location_to_entities lte ON ((lte.location_id = loc.id)))
     LEFT JOIN public.sparx_source_system s ON ((s.id = loc.source_id)))
     LEFT JOIN public.countries c ON ((c.id = loc.country)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_location OWNER TO postgres;

--
-- Name: source_platform; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.source_platform (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    description text,
    is_active boolean,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    name text,
    official_url text,
    platform_type public.platform_type_enum,
    region jsonb,
    source_platform_category public.source_platform_category_enum
);


ALTER TABLE public.source_platform OWNER TO postgres;

--
-- Name: mv_location_events; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_location_events AS
 SELECT lte.id AS location_event_id,
    lg.id AS location_id,
    lte.entity_type,
    lte.entity_id,
    lg.location_type,
    lg.lat,
    lg.long,
    public.st_setsrid(public.st_makepoint((lg.long)::double precision, (lg.lat)::double precision), 4326) AS geom_point,
    (public.st_setsrid(public.st_makepoint((lg.long)::double precision, (lg.lat)::double precision), 4326))::public.geography AS geog_point,
    lte.event_timestamp,
    lte.timezone_offset,
    ((EXTRACT(hour FROM (lte.event_timestamp + lte.timezone_offset)) * (60)::numeric) + EXTRACT(minute FROM (lte.event_timestamp + lte.timezone_offset))) AS minutes_from_midnight_in_timezone,
    lte.relationship_source AS geopositioning_source,
    lte.captured_by AS geopositioning_method,
    lte.source_platform AS source_platform_id,
    sp.name AS source_platform_name,
    lg.formatted_address
   FROM ((public.location_to_entities lte
     JOIN public.location lg ON ((lte.location_id = lg.id)))
     LEFT JOIN public.source_platform sp ON ((lte.source_platform = sp.id)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_location_events OWNER TO postgres;

--
-- Name: text_analysis_base; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.text_analysis_base (
    id uuid NOT NULL,
    additional_info text,
    ai_summary text,
    assigned_to jsonb,
    created_at timestamp without time zone,
    created_by uuid,
    effective_date date,
    expiry_date date,
    last_approved_at timestamp without time zone,
    last_approved_by uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    nlp_analysis_count integer,
    notes jsonb,
    notes_item_content text,
    notes_item_date timestamp without time zone,
    notes_item_user_id uuid,
    record_status public.record_status_enum,
    schema_version uuid,
    sentiment_analysis_count integer,
    source_content_id uuid,
    source_content_type public.source_content_type_enum
);


ALTER TABLE public.text_analysis_base OWNER TO postgres;

--
-- Name: mv_media_files_agg; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_media_files_agg AS
 SELECT ete.source_content_id,
    ete.source_content_type AS type,
    COALESCE(array_agg(jsonb_build_object('file_id', bf.id, 'file_name', bf.file_name)) FILTER (WHERE (bf.mime_type ~~ 'video/%'::text)), ARRAY[]::jsonb[]) AS videos,
    COALESCE(array_agg(jsonb_build_object('file_id', bf.id, 'file_name', bf.file_name)) FILTER (WHERE (bf.mime_type ~~ 'image/%'::text)), ARRAY[]::jsonb[]) AS images
   FROM ((public.text_analysis_base ete
     LEFT JOIN public.files_to_entities fte ON ((fte.entity_id = ete.source_content_id)))
     LEFT JOIN public.base_file bf ON ((bf.id = fte.file_id)))
  WHERE (ete.source_content_type = ANY (ARRAY['Post'::public.source_content_type_enum, 'Web-Article'::public.source_content_type_enum]))
  GROUP BY ete.source_content_id, ete.source_content_type
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_media_files_agg OWNER TO postgres;

--
-- Name: nlp_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nlp_entities (
    id integer NOT NULL,
    text text NOT NULL,
    label text NOT NULL
);


ALTER TABLE public.nlp_entities OWNER TO postgres;

--
-- Name: mv_nlp_entities_agg; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_nlp_entities_agg AS
 SELECT ete.source_content_id,
    jsonb_agg(jsonb_build_object('text', ne.text, 'label', ne.label, 'numeric_label', ete.numeric_label, 'value', ete.value)) AS entities_data
   FROM (public.enrichment_to_entity ete
     JOIN public.nlp_entities ne ON ((ne.id = ete.enrichment_id)))
  WHERE ((ete.enrichment_type = 'Entities'::text) AND (ete.type = ANY (ARRAY['post'::text, 'article'::text])))
  GROUP BY ete.source_content_id
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_nlp_entities_agg OWNER TO postgres;

--
-- Name: nlp_phrases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nlp_phrases (
    id integer NOT NULL,
    text text NOT NULL
);


ALTER TABLE public.nlp_phrases OWNER TO postgres;

--
-- Name: mv_nlp_phrases_agg; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_nlp_phrases_agg AS
 SELECT ete.source_content_id,
    jsonb_agg(jsonb_build_object('text', np.text, 'numeric_label', ete.numeric_label, 'value', ete.value)) AS phrases_data
   FROM (public.enrichment_to_entity ete
     JOIN public.nlp_phrases np ON ((np.id = ete.enrichment_id)))
  WHERE ((ete.enrichment_type = 'Phrases'::text) AND (ete.type = ANY (ARRAY['post'::text, 'article'::text])))
  GROUP BY ete.source_content_id
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_nlp_phrases_agg OWNER TO postgres;

--
-- Name: nlp_common_words; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nlp_common_words (
    id integer NOT NULL,
    text text NOT NULL
);


ALTER TABLE public.nlp_common_words OWNER TO postgres;

--
-- Name: mv_nlp_words_agg; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_nlp_words_agg AS
 SELECT ete.source_content_id,
    jsonb_agg(jsonb_build_object('text', nc.text, 'numeric_label', ete.numeric_label, 'value', ete.value)) AS words_data
   FROM (public.enrichment_to_entity ete
     JOIN public.nlp_common_words nc ON ((nc.id = ete.enrichment_id)))
  WHERE ((ete.enrichment_type = 'CommonWords'::text) AND (ete.type = ANY (ARRAY['post'::text, 'article'::text])))
  GROUP BY ete.source_content_id
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_nlp_words_agg OWNER TO postgres;

--
-- Name: sentiment_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sentiment_analysis (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    sentence text,
    sentence_type public.sentence_type_enum,
    sentiment integer,
    strength integer,
    text_analysis_base_id uuid,
    text_analysis_status public.text_analysis_status_enum,
    text_analysis_type public.text_analysis_type_enum
);


ALTER TABLE public.sentiment_analysis OWNER TO postgres;

--
-- Name: mv_sentiment_aggregates; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_sentiment_aggregates AS
 SELECT tab.source_content_id,
    ete.type,
    count(
        CASE
            WHEN (sa.sentiment = 1) THEN 1
            ELSE NULL::integer
        END) AS positive,
    count(
        CASE
            WHEN (sa.sentiment = '-1'::integer) THEN 1
            ELSE NULL::integer
        END) AS negative,
    count(
        CASE
            WHEN (sa.sentiment = ANY (ARRAY[1, '-1'::integer])) THEN 1
            ELSE 0
        END) AS total
   FROM ((public.text_analysis_base tab
     JOIN public.enrichment_to_entity ete ON ((ete.source_content_id = tab.source_content_id)))
     LEFT JOIN public.sentiment_analysis sa ON ((sa.text_analysis_base_id = tab.id)))
  WHERE (ete.type = ANY (ARRAY['post'::text, 'article'::text]))
  GROUP BY tab.source_content_id, ete.type
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_sentiment_aggregates OWNER TO postgres;

--
-- Name: post; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post (
    id uuid NOT NULL,
    content text,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    number_of_comments integer,
    number_of_likes integer,
    number_of_shares integer,
    poi_id uuid,
    post_last_update_at timestamp without time zone,
    post_link text,
    post_owner_full_name text,
    post_owner_profile text,
    posted_at timestamp without time zone,
    source_id uuid,
    source_item_id text,
    source_language uuid,
    source_platform uuid,
    target_language uuid,
    translated_content text
);


ALTER TABLE public.post OWNER TO postgres;

--
-- Name: web_article; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.web_article (
    id uuid NOT NULL,
    author_user_name text,
    content text,
    country text,
    country_code text,
    created_at timestamp without time zone,
    created_by uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    location uuid,
    number_of_comments integer,
    number_of_likes integer,
    number_of_shares integer,
    page_number text,
    poi_id uuid,
    published_at timestamp without time zone,
    published_at_style text,
    snippet text,
    source_id uuid,
    source_item_id text,
    source_language uuid,
    source_platform uuid,
    source_platform_field text,
    target_url text,
    title text,
    total_pages integer,
    translated_content text,
    translated_snippet text,
    web_article_last_updated_at timestamp without time zone,
    web_article_last_updated_at_style text
);


ALTER TABLE public.web_article OWNER TO postgres;

--
-- Name: mv_source_content_base; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_source_content_base AS
 SELECT post.id AS source_content_id,
    'post'::text AS type
   FROM public.post
UNION
 SELECT web_article.id AS source_content_id,
    'article'::text AS type
   FROM public.web_article
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_source_content_base OWNER TO postgres;

--
-- Name: mv_posts_articles; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_posts_articles AS
 WITH base_data AS (
         SELECT scb.source_content_id,
            scb.type,
            p.content AS post_content,
            p.post_owner_full_name,
            p.post_owner_profile,
            p.posted_at AS post_posted_at,
            (p.post_last_update_at)::text AS post_last_update,
            p.number_of_likes AS post_likes,
            p.number_of_shares AS post_shares,
            p.number_of_comments AS post_comments,
            p.entity_id AS post_poi_id,
            p.post_link,
            p.source_platform AS post_platform,
            p.source_language AS post_language,
            p.source_id AS post_source,
            wa.content AS article_content,
            wa.snippet,
            wa.title,
            wa.author_user_name,
            wa.published_at,
            (wa.last_updated_at)::text AS last_updated_at,
            wa.number_of_likes AS article_likes,
            wa.number_of_shares AS article_shares,
            wa.number_of_comments AS article_comments,
            wa.poi_id AS article_poi_id,
            wa.target_url,
            wa.source_platform AS article_platform,
            wa.source_language AS article_language,
            wa.source_id AS article_source
           FROM ((public.mv_source_content_base scb
             LEFT JOIN public.post p ON (((p.id = scb.source_content_id) AND (scb.type = 'post'::text))))
             LEFT JOIN public.web_article wa ON (((wa.id = scb.source_content_id) AND (scb.type = 'article'::text))))
        )
 SELECT bd.source_content_id AS id,
        CASE
            WHEN (bd.type = 'post'::text) THEN 'post'::text
            WHEN (bd.type = 'article'::text) THEN 'web_article'::text
            ELSE 'other'::text
        END AS source_type,
    COALESCE(bd.post_content, bd.article_content) AS content,
    bd.snippet,
    bd.title,
    COALESCE(sp1.name, sp2.name) AS platform_name,
    COALESCE(bd.post_owner_full_name, bd.author_user_name) AS post_owner_full_name,
    bd.post_owner_profile,
    COALESCE(bd.post_posted_at, bd.published_at) AS posted_at,
    COALESCE(bd.post_last_update, bd.last_updated_at) AS post_last_update_at,
    COALESCE(l1.name, l2.name) AS source_language,
        CASE
            WHEN (bd.type = 'post'::text) THEN bd.post_likes
            ELSE bd.article_likes
        END AS number_of_likes,
        CASE
            WHEN (bd.type = 'post'::text) THEN bd.post_shares
            ELSE bd.article_shares
        END AS number_of_shares,
    COALESCE(bd.post_comments, bd.article_comments, 0) AS number_of_comments,
    COALESCE(bd.post_poi_id, bd.article_poi_id) AS poi_id,
    COALESCE(bd.post_link, bd.target_url) AS post_link,
    COALESCE(s1.source_name, s2.source_name) AS source,
    COALESCE(mf.videos, ARRAY[]::jsonb[]) AS videos,
    COALESCE(mf.images, ARRAY[]::jsonb[]) AS images,
    mv_poi.profile_image_name AS profile_image,
    TRIM(BOTH FROM concat_ws(' '::text, mv_poi.first_name, mv_poi.middle_name, mv_poi.last_name)) AS author_name,
    0 AS total_data_points,
    jsonb_build_array(jsonb_build_object('enrichment_type', 'Entities', 'nlp_data', COALESCE(ne_agg.entities_data, '[]'::jsonb)), jsonb_build_object('enrichment_type', 'CommonWords', 'nlp_data', COALESCE(nw_agg.words_data, '[]'::jsonb)), jsonb_build_object('enrichment_type', 'Phrases', 'nlp_data', COALESCE(np_agg.phrases_data, '[]'::jsonb))) AS aggregated_nlp_data,
    jsonb_build_object('total', COALESCE(sa.total, (0)::bigint), 'positive', COALESCE(sa.positive, (0)::bigint), 'negative', COALESCE(sa.negative, (0)::bigint)) AS sentiment_summary
   FROM ((((((((((((base_data bd
     LEFT JOIN public.source_platform sp1 ON ((sp1.id = bd.post_platform)))
     LEFT JOIN public.source_platform sp2 ON ((sp2.id = bd.article_platform)))
     LEFT JOIN public.language l1 ON ((l1.id = bd.post_language)))
     LEFT JOIN public.language l2 ON ((l2.id = bd.article_language)))
     LEFT JOIN public.sparx_source_system s1 ON ((s1.id = bd.post_source)))
     LEFT JOIN public.sparx_source_system s2 ON ((s2.id = bd.article_source)))
     LEFT JOIN public.mv_person_of_interest_details mv_poi ON ((mv_poi.id = COALESCE(bd.post_poi_id, bd.article_poi_id))))
     LEFT JOIN public.mv_sentiment_aggregates sa ON (((sa.source_content_id = bd.source_content_id) AND (lower(sa.type) = lower(bd.type)))))
     LEFT JOIN public.mv_nlp_entities_agg ne_agg ON ((ne_agg.source_content_id = bd.source_content_id)))
     LEFT JOIN public.mv_nlp_words_agg nw_agg ON ((nw_agg.source_content_id = bd.source_content_id)))
     LEFT JOIN public.mv_nlp_phrases_agg np_agg ON ((np_agg.source_content_id = bd.source_content_id)))
     LEFT JOIN public.mv_media_files_agg mf ON (((mf.source_content_id = bd.source_content_id) AND (lower((mf.type)::text) = lower(bd.type)))))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_posts_articles OWNER TO postgres;

--
-- Name: mv_source_content_types; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_source_content_types AS
 SELECT post.id,
    'post'::text AS type,
    NULL::uuid AS file_id
   FROM public.post
UNION ALL
 SELECT web_article.id,
    'article'::text AS type,
    NULL::uuid AS file_id
   FROM public.web_article
UNION ALL
 SELECT unnest(document.page_ids) AS id,
    'document'::text AS type,
    document.base_file_id AS file_id
   FROM public.document
  WHERE ((document.page_ids IS NOT NULL) AND (array_length(document.page_ids, 1) > 0))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_source_content_types OWNER TO postgres;

--
-- Name: mv_url; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_url AS
 SELECT id,
    created_at,
    created_by,
    entity_id,
    entity_type AS finding_status,
    source_platform,
    secondary_user_name,
    user_name,
    value,
    lower("substring"(value, 'https?://([^/]+)'::text)) AS domain
   FROM public.url
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_url OWNER TO postgres;

--
-- Name: nlp_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nlp_analysis (
    id uuid NOT NULL,
    assigned_to jsonb,
    count integer,
    created_at timestamp without time zone,
    created_by uuid,
    effective_date date,
    enrichment_type public.enrichment_type_enum,
    entity_interactions text,
    expiry_date date,
    label public.label_enum,
    last_approved_at timestamp without time zone,
    last_approved_by uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    nlp_data jsonb,
    notes jsonb,
    notes_item_content text,
    notes_item_date timestamp without time zone,
    notes_item_user_id uuid,
    record_status public.record_status_enum,
    schema_version uuid,
    text_analysis_base_id uuid,
    text_analysis_status public.text_analysis_status_enum,
    text_analysis_type public.text_analysis_type_enum,
    topics_and_categories text
);


ALTER TABLE public.nlp_analysis OWNER TO postgres;

--
-- Name: nlp_common_words_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nlp_common_words_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nlp_common_words_id_seq OWNER TO postgres;

--
-- Name: nlp_common_words_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nlp_common_words_id_seq OWNED BY public.nlp_common_words.id;


--
-- Name: nlp_entities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nlp_entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nlp_entities_id_seq OWNER TO postgres;

--
-- Name: nlp_entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nlp_entities_id_seq OWNED BY public.nlp_entities.id;


--
-- Name: nlp_phrases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nlp_phrases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nlp_phrases_id_seq OWNER TO postgres;

--
-- Name: nlp_phrases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nlp_phrases_id_seq OWNED BY public.nlp_phrases.id;


--
-- Name: posts_articles_basic_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.posts_articles_basic_view AS
 SELECT post.id,
    'post'::text AS source_type,
    post.poi_id,
    sp.name AS platform_name,
    post.content,
    post.post_owner_full_name,
    post.posted_at,
    post.post_last_update_at,
    post.number_of_likes,
    post.number_of_comments,
    post.number_of_shares,
    l.iso2_char_code
   FROM ((public.post
     LEFT JOIN public.source_platform sp ON ((sp.id = post.source_platform)))
     LEFT JOIN public.language l ON ((l.id = post.source_language)))
UNION
 SELECT web_article.id,
    'web_article'::text AS source_type,
    web_article.poi_id,
    sp.name AS platform_name,
    web_article.content,
    web_article.author_user_name AS post_owner_full_name,
    web_article.published_at AS posted_at,
    web_article.last_updated_at AS post_last_update_at,
    web_article.number_of_likes,
    web_article.number_of_comments,
    web_article.number_of_shares,
    l.iso2_char_code
   FROM ((public.web_article
     LEFT JOIN public.source_platform sp ON ((sp.id = web_article.source_platform)))
     LEFT JOIN public.language l ON ((l.id = web_article.source_language)));


ALTER VIEW public.posts_articles_basic_view OWNER TO postgres;

--
-- Name: sexual_preference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sexual_preference (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    preferences jsonb,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.sexual_preference OWNER TO postgres;

--
-- Name: skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    description text,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    name text,
    poi_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.skill OWNER TO postgres;

--
-- Name: skill_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_to_entities (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    skill_id uuid,
    source_id uuid,
    source_item_id text,
    source_platform uuid
);


ALTER TABLE public.skill_to_entities OWNER TO postgres;

--
-- Name: web_article_to_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.web_article_to_entities (
    id uuid NOT NULL,
    created_at timestamp without time zone,
    created_by uuid,
    entity_id uuid,
    entity_type public.entity_type_enum,
    last_updated_at timestamp without time zone,
    last_updated_by uuid,
    poi_id uuid,
    relationship_type text,
    source_id uuid,
    source_item_id text,
    source_platform uuid,
    web_article_id uuid
);


ALTER TABLE public.web_article_to_entities OWNER TO postgres;

--
-- Name: enrichment_to_entity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrichment_to_entity ALTER COLUMN id SET DEFAULT nextval('public.enrichment_to_entity_id_seq'::regclass);


--
-- Name: knex_migrations_locations_service id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations_locations_service ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_locations_service_id_seq'::regclass);


--
-- Name: knex_migrations_locations_service_lock index; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations_locations_service_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_locations_service_lock_index_seq'::regclass);


--
-- Name: nlp_common_words id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_common_words ALTER COLUMN id SET DEFAULT nextval('public.nlp_common_words_id_seq'::regclass);


--
-- Name: nlp_entities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_entities ALTER COLUMN id SET DEFAULT nextval('public.nlp_entities_id_seq'::regclass);


--
-- Name: nlp_phrases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_phrases ALTER COLUMN id SET DEFAULT nextval('public.nlp_phrases_id_seq'::regclass);


--
-- Data for Name: accounts_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts_to_entities (id, account_id, created_at, created_by, entity_id, entity_type, last_updated_at, last_updated_by, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: base_file; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.base_file (id, created_at, created_by, creation_date, download_link, file_name, file_path, last_updated_at, last_updated_by, major_language, mime_type, poi_id, size_in_bytes, source_id, source_item_id, source_platform, unique_content_id) FROM stdin;
\.


--
-- Data for Name: case; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."case" (id, created_at, created_by, description, last_updated_at, last_updated_by, name, poi_id, priority, source_id, source_item_id, source_platform, status) FROM stdin;
\.


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company (id, business_status, ceo, company_logo, company_name, company_type, created_at, created_by, headquarters_location, incorporation_date, last_updated_at, last_updated_by, notes, number_of_employees, parent_company, poi_id, registration_number, social_media_profiles, source_id, source_item_id, source_platform, subsidiaries, website) FROM stdin;
\.


--
-- Data for Name: company_to_poi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_to_poi (id, company_id, created_at, created_by, date, department, employment_type, last_updated_at, last_updated_by, linked_in_profile_id, poi_id, role, source_id, source_item_id, source_platform, source_platform_id) FROM stdin;
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.countries (id, created_at, created_by, iso2_char_code, iso3_char_code, iso_country_code, iso_country_name, iso_official_state_name, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: country_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.country_to_entities (id, country_id, created_at, created_by, entity_id, entity_type, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: date; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.date (id, created_at, created_by, date_type, date_value, date_value_style, end_date, end_date_style, entity_id, entity_type, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform, start_date, start_date_style) FROM stdin;
\.


--
-- Data for Name: document; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document (id, ai_summary, assigned_to, author, base_file_id, content, created_at, created_by, device_contact_id, device_id, device_profile_id, device_raw_contact_id, document_origin, document_type, effective_date, expiry_date, file_format, last_approved_at, last_approved_by, last_updated_at, last_updated_by, legacy_nlp_analysis, notes, notes_item_content, notes_item_date, notes_item_user_id, poi_id, record_status, schema_version, sentiment_analysis, source_id, source_item_id, source_platform, summary, tags, title, topics, total_pages, page_ids, thumbnail) FROM stdin;
\.


--
-- Data for Name: document_page; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_page (document_id, page_id, text, loc) FROM stdin;
\.


--
-- Data for Name: education_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.education_history (id, awards_and_honors, certifications, created_at, created_by, date, degree, gpa, grade, image, last_updated_at, last_updated_by, location, poi_id, scholarship, school, source_id, source_item_id, source_platform, study_field, study_mode, url) FROM stdin;
\.


--
-- Data for Name: email; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email (id, account_id, created_at, created_by, email_value, finding_status, last_updated_at, last_updated_by, poi_id, scanning_time, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: email_address_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_address_to_entities (id, created_at, created_by, email_address_entity_type, email_address_id, entity_id, last_updated_at, last_updated_by, link_date, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: enrichment_to_entity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrichment_to_entity (id, source_content_id, type, file_id, enrichment_id, enrichment_type, numeric_label, value) FROM stdin;
\.


--
-- Data for Name: files_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.files_to_entities (id, association_type, count, created_at, created_by, entity_id, file_id, file_type, fte_entity_type, last_updated_at, last_updated_by, link_date, poi_id, source_id, source_item_id, source_platform, tags) FROM stdin;
\.


--
-- Data for Name: gender; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gender (id, created_at, created_by, gender, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, aliases, created_at, created_by, group_name, known_activities, last_updated_at, last_updated_by, locations_of_operation, number_of_members, poi_id, primary_bank_account, primary_crypto_address, primary_email, primary_location, primary_profile_image, primary_url, recent_media_mentions_posts, source_id, source_item_id, source_platform, type_category) FROM stdin;
\.


--
-- Data for Name: industry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.industry (id, created_at, created_by, description, last_updated_at, last_updated_by, name) FROM stdin;
\.


--
-- Data for Name: industry_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.industry_to_entities (id, created_at, created_by, entity_id, entity_type, industry_id, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: interest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interest (id, created_at, created_by, description, interest_category, interest_name, last_updated_at, last_updated_by) FROM stdin;
\.


--
-- Data for Name: interest_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interest_to_entities (id, created_at, created_by, entity_id, entity_type, interest_id, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: knex_migrations_locations_service; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knex_migrations_locations_service (id, name, batch, migration_time) FROM stdin;
\.


--
-- Data for Name: knex_migrations_locations_service_lock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knex_migrations_locations_service_lock (index, is_locked) FROM stdin;
\.


--
-- Data for Name: language; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.language (id, created_at, created_by, iso2_char_code, iso3_char_code, last_updated_at, last_updated_by, name, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: language_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.language_to_entities (id, created_at, created_by, entity_id, entity_type, language_id, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: lenz_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lenz_data (id, base_file_id, metadata, sample_filename, sample_total_objects, all_objects, country, object_classes, max_confidence_name, max_confidence, bounding_box) FROM stdin;
\.


--
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location (id, altitude, apartment, bearing, city, country, created_at, created_by, formatted_address, house_number, iso2_char_code, last_updated_at, last_updated_by, lat, location_type, long, po_box, poi_id, source_id, source_item_id, source_platform, speed, state, street, zip) FROM stdin;
\.


--
-- Data for Name: location_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location_to_entities (id, captured_by, created_at, created_by, entity_id, entity_type, event_timestamp, event_timestamp_value_style, last_updated_at, last_updated_by, location_id, poi_id, relationship_source, relationship_type, source_id, source_item_id, source_platform, timezone_offset) FROM stdin;
\.


--
-- Data for Name: name_to_poi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.name_to_poi (id, alias, created_at, created_by, first_name, last_name, last_updated_at, last_updated_by, middle_name, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: nlp_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nlp_analysis (id, assigned_to, count, created_at, created_by, effective_date, enrichment_type, entity_interactions, expiry_date, label, last_approved_at, last_approved_by, last_updated_at, last_updated_by, nlp_data, notes, notes_item_content, notes_item_date, notes_item_user_id, record_status, schema_version, text_analysis_base_id, text_analysis_status, text_analysis_type, topics_and_categories) FROM stdin;
\.


--
-- Data for Name: nlp_common_words; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nlp_common_words (id, text) FROM stdin;
\.


--
-- Data for Name: nlp_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nlp_entities (id, text, label) FROM stdin;
\.


--
-- Data for Name: nlp_phrases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nlp_phrases (id, text) FROM stdin;
\.


--
-- Data for Name: person_of_interest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.person_of_interest (id, created_at, created_by, description, favorite_by, home_country, last_updated_at, last_updated_by, notes, poi_id, primary_app, primary_bank_account, primary_career_location, primary_crypto_address, primary_deceased_date, primary_device, primary_dob, primary_email, primary_gender, primary_group, primary_interest, primary_language, primary_location, primary_name, primary_nationality, primary_organization, primary_personal_status, primary_profile_image, primary_url, primary_user_name, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: personal_status_to_poi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personal_status_to_poi (id, created_at, created_by, last_updated_at, last_updated_by, poi_id, source_id, source_item_id, source_platform, status) FROM stdin;
\.


--
-- Data for Name: phone_number; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phone_number (id, account_id, country, created_at, created_by, extension, finding_status, last_updated_at, last_updated_by, mobile_carrier, original_value, phone_type, poi_id, sanitized_value, scanning_time, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: phone_number_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phone_number_to_entities (id, created_at, created_by, entity_id, entity_type, last_updated_at, last_updated_by, phone_number_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: post; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post (id, content, created_at, created_by, entity_id, entity_type, last_updated_at, last_updated_by, number_of_comments, number_of_likes, number_of_shares, poi_id, post_last_update_at, post_link, post_owner_full_name, post_owner_profile, posted_at, source_id, source_item_id, source_language, source_platform, target_language, translated_content) FROM stdin;
\.


--
-- Data for Name: sentiment_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sentiment_analysis (id, created_at, created_by, last_updated_at, last_updated_by, sentence, sentence_type, sentiment, strength, text_analysis_base_id, text_analysis_status, text_analysis_type) FROM stdin;
\.


--
-- Data for Name: sexual_preference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sexual_preference (id, created_at, created_by, last_updated_at, last_updated_by, poi_id, preferences, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill (id, created_at, created_by, description, last_updated_at, last_updated_by, name, poi_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: skill_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_to_entities (id, created_at, created_by, entity_id, entity_type, last_updated_at, last_updated_by, poi_id, skill_id, source_id, source_item_id, source_platform) FROM stdin;
\.


--
-- Data for Name: source_platform; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.source_platform (id, created_at, created_by, description, is_active, last_updated_at, last_updated_by, name, official_url, platform_type, region, source_platform_category) FROM stdin;
\.


--
-- Data for Name: sparx_source_system; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sparx_source_system (id, api_key_required, authentication_method, created_at, created_by, data_format, data_refresh_rate, file_path, import_method, is_active, last_sync_date, last_updated_at, last_updated_by, source_category, source_description, source_name, source_url, system_source_type) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: text_analysis_base; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.text_analysis_base (id, additional_info, ai_summary, assigned_to, created_at, created_by, effective_date, expiry_date, last_approved_at, last_approved_by, last_updated_at, last_updated_by, nlp_analysis_count, notes, notes_item_content, notes_item_date, notes_item_user_id, record_status, schema_version, sentiment_analysis_count, source_content_id, source_content_type) FROM stdin;
\.


--
-- Data for Name: url; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.url (id, created_at, created_by, entity_id, entity_type, finding_status, last_updated_at, last_updated_by, poi_id, scanning_time, secondary_user_name, source_id, source_item_id, source_platform, user_name, value) FROM stdin;
\.


--
-- Data for Name: user_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_accounts (id, about, additional_data, alias, created_at, created_by, details, display_name, email, extracted_from_content_type, last_played, last_seen, last_updated_at, last_updated_by, location, password, phone, poi_id, profile_image, registration_date, source_id, source_item_id, source_platform, source_url, title, tokens, user_id, user_name) FROM stdin;
\.


--
-- Data for Name: web_article; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.web_article (id, author_user_name, content, country, country_code, created_at, created_by, last_updated_at, last_updated_by, location, number_of_comments, number_of_likes, number_of_shares, page_number, poi_id, published_at, published_at_style, snippet, source_id, source_item_id, source_language, source_platform, source_platform_field, target_url, title, total_pages, translated_content, translated_snippet, web_article_last_updated_at, web_article_last_updated_at_style) FROM stdin;
\.


--
-- Data for Name: web_article_to_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.web_article_to_entities (id, created_at, created_by, entity_id, entity_type, last_updated_at, last_updated_by, poi_id, relationship_type, source_id, source_item_id, source_platform, web_article_id) FROM stdin;
\.


--
-- Name: enrichment_to_entity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrichment_to_entity_id_seq', 1, false);


--
-- Name: knex_migrations_locations_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knex_migrations_locations_service_id_seq', 1, false);


--
-- Name: knex_migrations_locations_service_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knex_migrations_locations_service_lock_index_seq', 1, false);


--
-- Name: nlp_common_words_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nlp_common_words_id_seq', 1, false);


--
-- Name: nlp_entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nlp_entities_id_seq', 1, false);


--
-- Name: nlp_phrases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nlp_phrases_id_seq', 1, false);


--
-- Name: accounts_to_entities accounts_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_to_entities
    ADD CONSTRAINT accounts_to_entities_pkey PRIMARY KEY (id);


--
-- Name: base_file base_file_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.base_file
    ADD CONSTRAINT base_file_pkey PRIMARY KEY (id);


--
-- Name: case case_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."case"
    ADD CONSTRAINT case_pkey PRIMARY KEY (id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: company_to_poi company_to_poi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_to_poi
    ADD CONSTRAINT company_to_poi_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: country_to_entities country_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_to_entities
    ADD CONSTRAINT country_to_entities_pkey PRIMARY KEY (id);


--
-- Name: date date_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.date
    ADD CONSTRAINT date_pkey PRIMARY KEY (id);


--
-- Name: document_page document_page_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_page
    ADD CONSTRAINT document_page_pkey PRIMARY KEY (document_id, page_id);


--
-- Name: document document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- Name: education_history education_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education_history
    ADD CONSTRAINT education_history_pkey PRIMARY KEY (id);


--
-- Name: email_address_to_entities email_address_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_address_to_entities
    ADD CONSTRAINT email_address_to_entities_pkey PRIMARY KEY (id);


--
-- Name: email email_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email
    ADD CONSTRAINT email_pkey PRIMARY KEY (id);


--
-- Name: enrichment_to_entity enrichment_to_entity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrichment_to_entity
    ADD CONSTRAINT enrichment_to_entity_pkey PRIMARY KEY (id);


--
-- Name: enrichment_to_entity enrichment_to_entity_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrichment_to_entity
    ADD CONSTRAINT enrichment_to_entity_unique UNIQUE (file_id, source_content_id, type, enrichment_id, enrichment_type);


--
-- Name: files_to_entities files_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files_to_entities
    ADD CONSTRAINT files_to_entities_pkey PRIMARY KEY (id);


--
-- Name: gender gender_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gender
    ADD CONSTRAINT gender_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: industry industry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry
    ADD CONSTRAINT industry_pkey PRIMARY KEY (id);


--
-- Name: industry_to_entities industry_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.industry_to_entities
    ADD CONSTRAINT industry_to_entities_pkey PRIMARY KEY (id);


--
-- Name: interest interest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interest
    ADD CONSTRAINT interest_pkey PRIMARY KEY (id);


--
-- Name: interest_to_entities interest_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interest_to_entities
    ADD CONSTRAINT interest_to_entities_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_locations_service_lock knex_migrations_locations_service_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations_locations_service_lock
    ADD CONSTRAINT knex_migrations_locations_service_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations_locations_service knex_migrations_locations_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations_locations_service
    ADD CONSTRAINT knex_migrations_locations_service_pkey PRIMARY KEY (id);


--
-- Name: language language_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.language
    ADD CONSTRAINT language_pkey PRIMARY KEY (id);


--
-- Name: language_to_entities language_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.language_to_entities
    ADD CONSTRAINT language_to_entities_pkey PRIMARY KEY (id);


--
-- Name: lenz_data lenz_data_base_file_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lenz_data
    ADD CONSTRAINT lenz_data_base_file_id_unique UNIQUE (base_file_id);


--
-- Name: lenz_data lenz_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lenz_data
    ADD CONSTRAINT lenz_data_pkey PRIMARY KEY (id);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (id);


--
-- Name: location_to_entities location_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_to_entities
    ADD CONSTRAINT location_to_entities_pkey PRIMARY KEY (id);


--
-- Name: name_to_poi name_to_poi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.name_to_poi
    ADD CONSTRAINT name_to_poi_pkey PRIMARY KEY (id);


--
-- Name: nlp_analysis nlp_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_analysis
    ADD CONSTRAINT nlp_analysis_pkey PRIMARY KEY (id);


--
-- Name: nlp_common_words nlp_common_words_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_common_words
    ADD CONSTRAINT nlp_common_words_pkey PRIMARY KEY (id);


--
-- Name: nlp_common_words nlp_common_words_text_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_common_words
    ADD CONSTRAINT nlp_common_words_text_key UNIQUE (text);


--
-- Name: nlp_entities nlp_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_entities
    ADD CONSTRAINT nlp_entities_pkey PRIMARY KEY (id);


--
-- Name: nlp_entities nlp_entities_text_label_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_entities
    ADD CONSTRAINT nlp_entities_text_label_key UNIQUE (text, label);


--
-- Name: nlp_phrases nlp_phrases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_phrases
    ADD CONSTRAINT nlp_phrases_pkey PRIMARY KEY (id);


--
-- Name: nlp_phrases nlp_phrases_text_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nlp_phrases
    ADD CONSTRAINT nlp_phrases_text_key UNIQUE (text);


--
-- Name: person_of_interest person_of_interest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.person_of_interest
    ADD CONSTRAINT person_of_interest_pkey PRIMARY KEY (id);


--
-- Name: personal_status_to_poi personal_status_to_poi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_status_to_poi
    ADD CONSTRAINT personal_status_to_poi_pkey PRIMARY KEY (id);


--
-- Name: phone_number phone_number_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_number
    ADD CONSTRAINT phone_number_pkey PRIMARY KEY (id);


--
-- Name: phone_number_to_entities phone_number_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_number_to_entities
    ADD CONSTRAINT phone_number_to_entities_pkey PRIMARY KEY (id);


--
-- Name: post post_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT post_pkey PRIMARY KEY (id);


--
-- Name: sentiment_analysis sentiment_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sentiment_analysis
    ADD CONSTRAINT sentiment_analysis_pkey PRIMARY KEY (id);


--
-- Name: sexual_preference sexual_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sexual_preference
    ADD CONSTRAINT sexual_preference_pkey PRIMARY KEY (id);


--
-- Name: skill skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_pkey PRIMARY KEY (id);


--
-- Name: skill_to_entities skill_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_to_entities
    ADD CONSTRAINT skill_to_entities_pkey PRIMARY KEY (id);


--
-- Name: source_platform source_platform_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.source_platform
    ADD CONSTRAINT source_platform_pkey PRIMARY KEY (id);


--
-- Name: sparx_source_system sparx_source_system_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sparx_source_system
    ADD CONSTRAINT sparx_source_system_pkey PRIMARY KEY (id);


--
-- Name: text_analysis_base text_analysis_base_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.text_analysis_base
    ADD CONSTRAINT text_analysis_base_pkey PRIMARY KEY (id);


--
-- Name: url url_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.url
    ADD CONSTRAINT url_pkey PRIMARY KEY (id);


--
-- Name: user_accounts user_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_accounts
    ADD CONSTRAINT user_accounts_pkey PRIMARY KEY (id);


--
-- Name: web_article web_article_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.web_article
    ADD CONSTRAINT web_article_pkey PRIMARY KEY (id);


--
-- Name: web_article_to_entities web_article_to_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.web_article_to_entities
    ADD CONSTRAINT web_article_to_entities_pkey PRIMARY KEY (id);


--
-- Name: idx_accounts_to_entities_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_to_entities_entity_id ON public.accounts_to_entities USING btree (entity_id);


--
-- Name: idx_base_file_file_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_base_file_file_name_trgm ON public.base_file USING gin (file_name public.gin_trgm_ops);


--
-- Name: idx_base_file_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_base_file_id ON public.base_file USING btree (id);


--
-- Name: idx_company_to_poi_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_to_poi_company_id ON public.company_to_poi USING btree (company_id);


--
-- Name: idx_document_author_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_author_trgm ON public.document USING gin (author public.gin_trgm_ops);


--
-- Name: idx_document_base_file_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_base_file_id ON public.document USING btree (base_file_id);


--
-- Name: idx_document_page_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_page_document_id ON public.document_page USING btree (document_id);


--
-- Name: idx_document_page_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_page_id ON public.document_page USING btree (page_id);


--
-- Name: idx_document_page_ids_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_page_ids_gin ON public.document USING gin (page_ids);


--
-- Name: idx_document_page_text_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_page_text_trgm ON public.document_page USING gin (text public.gin_trgm_ops);


--
-- Name: idx_document_title_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_title_trgm ON public.document USING gin (title public.gin_trgm_ops);


--
-- Name: idx_email_address_to_entities_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_address_to_entities_entity_id ON public.email_address_to_entities USING btree (entity_id);


--
-- Name: idx_enrichment_to_entity_enrichment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrichment_to_entity_enrichment_id ON public.enrichment_to_entity USING btree (enrichment_id, enrichment_type);


--
-- Name: idx_enrichment_to_entity_enrichment_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrichment_to_entity_enrichment_type ON public.enrichment_to_entity USING btree (enrichment_type);


--
-- Name: idx_enrichment_to_entity_file_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrichment_to_entity_file_id ON public.enrichment_to_entity USING btree (file_id);


--
-- Name: idx_enrichment_to_entity_source_content_id_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrichment_to_entity_source_content_id_type ON public.enrichment_to_entity USING btree (source_content_id, type);


--
-- Name: idx_enrichment_to_entity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrichment_to_entity_type ON public.enrichment_to_entity USING btree (type);


--
-- Name: idx_ete_enrichment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ete_enrichment_id ON public.enrichment_to_entity USING btree (enrichment_id);


--
-- Name: idx_ete_file_type_enrichment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ete_file_type_enrichment ON public.enrichment_to_entity USING btree (file_id, type, enrichment_type);


--
-- Name: idx_industry_to_entities_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_industry_to_entities_entity_id ON public.industry_to_entities USING btree (entity_id);


--
-- Name: idx_interest_to_entities_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interest_to_entities_entity_id ON public.interest_to_entities USING btree (entity_id);


--
-- Name: idx_location_to_entities_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_location_to_entities_entity_id ON public.location_to_entities USING btree (entity_id);


--
-- Name: idx_mv_location_events_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_entity_id ON public.mv_location_events USING btree (entity_id);


--
-- Name: idx_mv_location_events_geog_point; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_geog_point ON public.mv_location_events USING gist (geog_point);


--
-- Name: idx_mv_location_events_geom_point; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_geom_point ON public.mv_location_events USING gist (geom_point);


--
-- Name: idx_mv_location_events_geopositioning_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_geopositioning_method ON public.mv_location_events USING btree (geopositioning_method);


--
-- Name: idx_mv_location_events_geopositioning_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_geopositioning_source ON public.mv_location_events USING btree (geopositioning_source);


--
-- Name: idx_mv_location_events_location_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_location_type ON public.mv_location_events USING btree (location_type);


--
-- Name: idx_mv_location_events_minutes_from_midnight_in_timezone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_minutes_from_midnight_in_timezone ON public.mv_location_events USING btree (minutes_from_midnight_in_timezone);


--
-- Name: idx_mv_location_events_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_location_events_timestamp ON public.mv_location_events USING btree (event_timestamp);


--
-- Name: idx_mv_media_files_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_media_files_pk ON public.mv_media_files_agg USING btree (source_content_id, type);


--
-- Name: idx_mv_nlp_entities_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_nlp_entities_pk ON public.mv_nlp_entities_agg USING btree (source_content_id);


--
-- Name: idx_mv_nlp_phrases_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_nlp_phrases_pk ON public.mv_nlp_phrases_agg USING btree (source_content_id);


--
-- Name: idx_mv_nlp_words_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_nlp_words_pk ON public.mv_nlp_words_agg USING btree (source_content_id);


--
-- Name: idx_mv_person_of_interest_details_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_person_of_interest_details_city ON public.mv_person_of_interest_details USING btree (city) WHERE (city IS NOT NULL);


--
-- Name: idx_mv_person_of_interest_details_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_person_of_interest_details_country ON public.mv_person_of_interest_details USING btree (country) WHERE (country IS NOT NULL);


--
-- Name: idx_mv_person_of_interest_details_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_person_of_interest_details_email ON public.mv_person_of_interest_details USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_mv_person_of_interest_details_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_person_of_interest_details_id ON public.mv_person_of_interest_details USING btree (id);


--
-- Name: idx_mv_person_of_interest_details_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_person_of_interest_details_name ON public.mv_person_of_interest_details USING btree (first_name, last_name) WHERE ((first_name IS NOT NULL) OR (last_name IS NOT NULL));


--
-- Name: idx_mv_person_of_interest_details_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_person_of_interest_details_phone ON public.mv_person_of_interest_details USING btree (phone_number) WHERE (phone_number IS NOT NULL);


--
-- Name: idx_mv_person_of_interest_details_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_person_of_interest_details_username ON public.mv_person_of_interest_details USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: idx_mv_sentiment_agg_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_sentiment_agg_pk ON public.mv_sentiment_aggregates USING btree (source_content_id, type);


--
-- Name: idx_mv_source_content_base_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_source_content_base_pk ON public.mv_source_content_base USING btree (source_content_id, type);


--
-- Name: idx_mv_source_content_types_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_source_content_types_id ON public.mv_source_content_types USING btree (id);


--
-- Name: idx_nlp_common_words_text; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_nlp_common_words_text ON public.nlp_common_words USING btree (text);


--
-- Name: idx_nlp_entities_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nlp_entities_id ON public.nlp_entities USING btree (id);


--
-- Name: idx_nlp_entities_text_label; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_nlp_entities_text_label ON public.nlp_entities USING btree (text, label);


--
-- Name: idx_nlp_phrases_text; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_nlp_phrases_text ON public.nlp_phrases USING btree (text);


--
-- Name: idx_phone_number_to_entities_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phone_number_to_entities_entity_id ON public.phone_number_to_entities USING btree (entity_id);


--
-- Name: idx_text_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_text_trgm ON public.document_page USING gin (text public.gin_trgm_ops);


--
-- Name: idx_title_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_title_trgm ON public.document USING gin (title public.gin_trgm_ops);


--
-- Name: mv_person_of_interest_details; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.mv_person_of_interest_details;


--
-- PostgreSQL database dump complete
--
