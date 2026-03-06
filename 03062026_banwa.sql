--
-- PostgreSQL database dump
--

\restrict trFxHbrIosCdM1ViYDBtzCWuJKEgtW0qURqu01B0hmWwhR9JnGsSRUffM3Xw7Wi

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-06 21:21:17

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
-- TOC entry 2 (class 3079 OID 43003)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 6270 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 987 (class 1255 OID 44085)
-- Name: update_construction_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_construction_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_construction_timestamp() OWNER TO postgres;

--
-- TOC entry 947 (class 1255 OID 44086)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 44087)
-- Name: archives; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archives (
    archive_id integer NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id integer NOT NULL,
    supabase_user_id uuid NOT NULL,
    archived_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    restored_at timestamp without time zone,
    is_restored boolean DEFAULT false,
    full_name character varying(255),
    role_id integer,
    email character varying(255) NOT NULL
);


ALTER TABLE public.archives OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 44099)
-- Name: archives_archive_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.archives_archive_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.archives_archive_id_seq OWNER TO postgres;

--
-- TOC entry 6271 (class 0 OID 0)
-- Dependencies: 226
-- Name: archives_archive_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.archives_archive_id_seq OWNED BY public.archives.archive_id;


--
-- TOC entry 227 (class 1259 OID 44100)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    supabase_user_id uuid,
    role_id integer NOT NULL,
    category character varying(50),
    action character varying(20) NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id integer,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    full_name character varying(255)
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 44110)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 6272 (class 0 OID 0)
-- Dependencies: 228
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 272 (class 1259 OID 44578)
-- Name: barangay_boundaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barangay_boundaries (
    boundary_id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    coordinates jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.barangay_boundaries OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 44587)
-- Name: barangay_boundaries_boundary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.barangay_boundaries_boundary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.barangay_boundaries_boundary_id_seq OWNER TO postgres;

--
-- TOC entry 6273 (class 0 OID 0)
-- Dependencies: 273
-- Name: barangay_boundaries_boundary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.barangay_boundaries_boundary_id_seq OWNED BY public.barangay_boundaries.boundary_id;


--
-- TOC entry 268 (class 1259 OID 44549)
-- Name: barangay_hazards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barangay_hazards (
    hazard_id integer NOT NULL,
    hazard_type character varying(50),
    hazard_name character varying(255),
    risk_level character varying(20),
    description text,
    geom public.geography(Polygon,4326),
    properties jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.barangay_hazards OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 44557)
-- Name: barangay_hazards_hazard_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.barangay_hazards_hazard_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.barangay_hazards_hazard_id_seq OWNER TO postgres;

--
-- TOC entry 6274 (class 0 OID 0)
-- Dependencies: 269
-- Name: barangay_hazards_hazard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.barangay_hazards_hazard_id_seq OWNED BY public.barangay_hazards.hazard_id;


--
-- TOC entry 229 (class 1259 OID 44130)
-- Name: business_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_applications (
    id integer NOT NULL,
    business_name character varying(255) NOT NULL,
    type_of_business character varying(100) NOT NULL,
    nature_of_business character varying(100) NOT NULL,
    nature_of_business_specify character varying(255),
    address_of_business text NOT NULL,
    business_status json,
    telephone_no_business character varying(20),
    email_address character varying(255),
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    telephone_no_owner character varying(20),
    address_owner text,
    type_of_structure character varying(100),
    type_of_structure_specify character varying(255),
    no_of_employees integer,
    requirements json,
    requirement_upload character varying(500),
    status character varying(50) DEFAULT 'Pending'::character varying,
    approval_comments text,
    disapproval_reason text,
    application_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_status character varying(50) DEFAULT 'Unpaid'::character varying,
    amount_due numeric(10,2) DEFAULT 0.00,
    amount_paid numeric(10,2) DEFAULT 0.00,
    or_number character varying(50),
    payment_date timestamp without time zone,
    payment_method character varying(50),
    supabase_user_id text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    dss_status character varying(50),
    suffix character varying(20),
    nature_of_application character varying(50),
    requirement_upload_json jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.business_applications OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 44150)
-- Name: business_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_applications_id_seq OWNER TO postgres;

--
-- TOC entry 6275 (class 0 OID 0)
-- Dependencies: 230
-- Name: business_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_applications_id_seq OWNED BY public.business_applications.id;


--
-- TOC entry 231 (class 1259 OID 44151)
-- Name: business_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_evaluations (
    id integer NOT NULL,
    application_id integer NOT NULL,
    dss_status character varying(50) DEFAULT 'Pending Evaluation'::character varying NOT NULL,
    evaluation_details jsonb,
    evaluated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.business_evaluations OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 44161)
-- Name: business_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_evaluations_id_seq OWNER TO postgres;

--
-- TOC entry 6276 (class 0 OID 0)
-- Dependencies: 232
-- Name: business_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_evaluations_id_seq OWNED BY public.business_evaluations.id;


--
-- TOC entry 233 (class 1259 OID 44162)
-- Name: business_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_files (
    id integer NOT NULL,
    application_id integer,
    filename text,
    saved_filename text,
    file_url text,
    checksum text,
    size_bytes integer,
    mime_type text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.business_files OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 44169)
-- Name: business_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_files_id_seq OWNER TO postgres;

--
-- TOC entry 6277 (class 0 OID 0)
-- Dependencies: 234
-- Name: business_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_files_id_seq OWNED BY public.business_files.id;


--
-- TOC entry 235 (class 1259 OID 44170)
-- Name: business_ocr_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_ocr_results (
    id integer NOT NULL,
    application_id integer,
    filename character varying(500),
    saved_filename character varying(500),
    file_url text,
    ocr_result jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.business_ocr_results OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 44177)
-- Name: business_ocr_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_ocr_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_ocr_results_id_seq OWNER TO postgres;

--
-- TOC entry 6278 (class 0 OID 0)
-- Dependencies: 236
-- Name: business_ocr_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_ocr_results_id_seq OWNED BY public.business_ocr_results.id;


--
-- TOC entry 237 (class 1259 OID 44178)
-- Name: construction_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.construction_applications (
    id integer NOT NULL,
    supabase_user_id text,
    first_name character varying(50) NOT NULL,
    middle_name character varying(50),
    last_name character varying(50) NOT NULL,
    suffix character varying(20),
    contact_no_owner character varying(20),
    owner_address text,
    nature_of_work text,
    type_of_work text,
    nature_of_activity text,
    details_of_work text,
    start_date date,
    end_date date,
    number_of_working_days integer,
    number_of_workers integer,
    contractor_name text,
    contractor_contact_number text,
    application_method text,
    construction_address text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    requirement_upload text,
    agreed integer DEFAULT 0,
    application_date date DEFAULT CURRENT_DATE NOT NULL,
    request_date date,
    status character varying(50) DEFAULT 'Pending'::character varying,
    approval_comments text,
    disapproval_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_status character varying(50),
    amount_due numeric(10,2),
    amount_paid numeric(10,2),
    or_number character varying(50),
    payment_date timestamp without time zone,
    payment_method character varying(50),
    dss_status character varying(50),
    requirement_upload_json jsonb
);


ALTER TABLE public.construction_applications OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 44192)
-- Name: construction_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.construction_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.construction_applications_id_seq OWNER TO postgres;

--
-- TOC entry 6279 (class 0 OID 0)
-- Dependencies: 238
-- Name: construction_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.construction_applications_id_seq OWNED BY public.construction_applications.id;


--
-- TOC entry 239 (class 1259 OID 44193)
-- Name: construction_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.construction_evaluations (
    id integer NOT NULL,
    application_id integer NOT NULL,
    dss_status character varying(50) DEFAULT 'Pending Evaluation'::character varying NOT NULL,
    evaluation_details jsonb,
    evaluated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.construction_evaluations OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 44203)
-- Name: construction_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.construction_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.construction_evaluations_id_seq OWNER TO postgres;

--
-- TOC entry 6280 (class 0 OID 0)
-- Dependencies: 240
-- Name: construction_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.construction_evaluations_id_seq OWNED BY public.construction_evaluations.id;


--
-- TOC entry 241 (class 1259 OID 44204)
-- Name: construction_ocr_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.construction_ocr_results (
    id integer NOT NULL,
    application_id integer NOT NULL,
    filename character varying(255),
    saved_filename character varying(500),
    file_url text,
    ocr_result jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.construction_ocr_results OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 44212)
-- Name: construction_ocr_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.construction_ocr_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.construction_ocr_results_id_seq OWNER TO postgres;

--
-- TOC entry 6281 (class 0 OID 0)
-- Dependencies: 242
-- Name: construction_ocr_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.construction_ocr_results_id_seq OWNED BY public.construction_ocr_results.id;


--
-- TOC entry 266 (class 1259 OID 44531)
-- Name: fault_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fault_lines (
    fault_line_id integer NOT NULL,
    fault_name character varying(255) NOT NULL,
    fault_type character varying(100) DEFAULT 'active'::character varying,
    description text,
    risk_level character varying(50) DEFAULT 'high'::character varying,
    properties jsonb,
    geom public.geometry(LineString,4326) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.fault_lines OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 44543)
-- Name: fault_lines_fault_line_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fault_lines_fault_line_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fault_lines_fault_line_id_seq OWNER TO postgres;

--
-- TOC entry 6282 (class 0 OID 0)
-- Dependencies: 267
-- Name: fault_lines_fault_line_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fault_lines_fault_line_id_seq OWNED BY public.fault_lines.fault_line_id;


--
-- TOC entry 270 (class 1259 OID 44563)
-- Name: house_polygons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.house_polygons (
    house_id integer NOT NULL,
    osm_id bigint,
    address character varying(255),
    street_name character varying(100),
    house_number character varying(20),
    coordinates jsonb,
    center_lat numeric(10,8),
    center_lng numeric(11,8),
    area_sqm numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.house_polygons OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 44571)
-- Name: house_polygons_house_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.house_polygons_house_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.house_polygons_house_id_seq OWNER TO postgres;

--
-- TOC entry 6283 (class 0 OID 0)
-- Dependencies: 271
-- Name: house_polygons_house_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.house_polygons_house_id_seq OWNED BY public.house_polygons.house_id;


--
-- TOC entry 243 (class 1259 OID 44235)
-- Name: incident_report_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_report_evaluations (
    id integer NOT NULL,
    application_id integer NOT NULL,
    dss_status character varying(50) DEFAULT 'Pending Evaluation'::character varying NOT NULL,
    evaluation_details jsonb,
    evaluated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.incident_report_evaluations OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 44245)
-- Name: incident_report_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.incident_report_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.incident_report_evaluations_id_seq OWNER TO postgres;

--
-- TOC entry 6284 (class 0 OID 0)
-- Dependencies: 244
-- Name: incident_report_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.incident_report_evaluations_id_seq OWNED BY public.incident_report_evaluations.id;


--
-- TOC entry 245 (class 1259 OID 44246)
-- Name: incident_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_reports (
    id integer NOT NULL,
    rp_full_name character varying(255) NOT NULL,
    rp_address text NOT NULL,
    rp_contact character varying(15) NOT NULL,
    rp_relationship character varying(100),
    vic_full_name character varying(255),
    vic_address text,
    vic_contact character varying(15),
    vic_citizenship character varying(100),
    vic_gender character varying(50),
    vic_dob date,
    vic_occupation character varying(100),
    sus_full_name character varying(255),
    sus_address text,
    sus_contact character varying(15),
    sus_gender character varying(50),
    sus_description text,
    incident_type character varying(255) NOT NULL,
    incident_timestamp timestamp with time zone NOT NULL,
    date_reported timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    description text NOT NULL,
    witness_data_json jsonb,
    latitude numeric(10,8),
    longitude numeric(11,8),
    supabase_user_id text,
    update_comments text,
    resolution_details text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dss_status character varying(50) DEFAULT 'Pending Evaluation'::character varying,
    status character varying(50) DEFAULT 'Pending'::character varying,
    approval_comments text,
    disapproval_comments text,
    application_date date
);


ALTER TABLE public.incident_reports OWNER TO postgres;

--
-- TOC entry 6285 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE incident_reports; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.incident_reports IS 'Stores detailed records of all submitted incident reports.';


--
-- TOC entry 6286 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN incident_reports.witness_data_json; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.incident_reports.witness_data_json IS 'Structured JSON array containing full name, address, and contact for all witnesses.';


--
-- TOC entry 246 (class 1259 OID 44263)
-- Name: incident_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.incident_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.incident_reports_id_seq OWNER TO postgres;

--
-- TOC entry 6287 (class 0 OID 0)
-- Dependencies: 246
-- Name: incident_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.incident_reports_id_seq OWNED BY public.incident_reports.id;


--
-- TOC entry 247 (class 1259 OID 44264)
-- Name: ocr_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ocr_jobs (
    id integer NOT NULL,
    job_type text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);


ALTER TABLE public.ocr_jobs OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 44277)
-- Name: ocr_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ocr_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ocr_jobs_id_seq OWNER TO postgres;

--
-- TOC entry 6288 (class 0 OID 0)
-- Dependencies: 248
-- Name: ocr_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ocr_jobs_id_seq OWNED BY public.ocr_jobs.id;


--
-- TOC entry 249 (class 1259 OID 44278)
-- Name: ocr_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ocr_verifications (
    id integer NOT NULL,
    supabase_user_id uuid,
    email character varying(255),
    meta jsonb,
    data jsonb,
    verified boolean NOT NULL,
    reasons jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ocr_verifications OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 44286)
-- Name: ocr_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ocr_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ocr_verifications_id_seq OWNER TO postgres;

--
-- TOC entry 6289 (class 0 OID 0)
-- Dependencies: 250
-- Name: ocr_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ocr_verifications_id_seq OWNED BY public.ocr_verifications.id;


--
-- TOC entry 251 (class 1259 OID 44287)
-- Name: resident; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resident (
    resident_id integer NOT NULL,
    user_id integer,
    household_head_name character varying(100),
    address character varying(255),
    household_size integer,
    contact_no character varying(20),
    household_status character varying(10),
    registered_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    supabase_user_id uuid,
    first_name character varying(50),
    middle_name character varying(50),
    last_name character varying(50),
    suffix character varying(20),
    ocr_verified boolean DEFAULT false,
    CONSTRAINT resident_household_status_check CHECK (((household_status)::text = ANY (ARRAY[('Owner'::character varying)::text, ('Renter'::character varying)::text])))
);


ALTER TABLE public.resident OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 44295)
-- Name: resident_resident_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resident_resident_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resident_resident_id_seq OWNER TO postgres;

--
-- TOC entry 6290 (class 0 OID 0)
-- Dependencies: 252
-- Name: resident_resident_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resident_resident_id_seq OWNED BY public.resident.resident_id;


--
-- TOC entry 253 (class 1259 OID 44296)
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    role_id integer NOT NULL,
    role_name character varying(50),
    description text
);


ALTER TABLE public.role OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 44302)
-- Name: role_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_role_id_seq OWNER TO postgres;

--
-- TOC entry 6291 (class 0 OID 0)
-- Dependencies: 254
-- Name: role_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_role_id_seq OWNED BY public.role.role_id;


--
-- TOC entry 255 (class 1259 OID 44303)
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 44310)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50),
    password character varying(255),
    email character varying(100),
    full_name character varying(100),
    role_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    supabase_user_id uuid,
    first_name character varying(50),
    middle_name character varying(50),
    last_name character varying(50),
    suffix character varying(20),
    is_archived boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    suspend_reason character varying(255) DEFAULT NULL::character varying,
    reason_details character varying(255) DEFAULT NULL::character varying,
    suspended_until timestamp with time zone,
    latitude numeric(10,8),
    longitude numeric(11,8),
    lot_no character varying(255),
    street character varying(255),
    ocr_verified boolean
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 44321)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 6292 (class 0 OID 0)
-- Dependencies: 257
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 258 (class 1259 OID 44322)
-- Name: utility_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_applications (
    id integer NOT NULL,
    address_of_utility text NOT NULL,
    first_name character varying(50) NOT NULL,
    middle_name character varying(50),
    last_name character varying(50) NOT NULL,
    suffix character varying(20),
    owner_contact_no character varying(20),
    owner_address text,
    status character varying(50) DEFAULT 'Pending'::character varying,
    approval_comments text,
    disapproval_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    supabase_user_id text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    date_of_work date,
    request_date date,
    nature_of_work text,
    provider text,
    agreed integer DEFAULT 0,
    application_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dss_status character varying(50)
);


ALTER TABLE public.utility_applications OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 44337)
-- Name: utility_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utility_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utility_applications_id_seq OWNER TO postgres;

--
-- TOC entry 6293 (class 0 OID 0)
-- Dependencies: 259
-- Name: utility_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utility_applications_id_seq OWNED BY public.utility_applications.id;


--
-- TOC entry 260 (class 1259 OID 44338)
-- Name: utility_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_evaluations (
    id integer NOT NULL,
    application_id integer NOT NULL,
    dss_status character varying(50) DEFAULT 'Pending Evaluation'::character varying NOT NULL,
    evaluation_details jsonb,
    evaluated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.utility_evaluations OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 44348)
-- Name: utility_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utility_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utility_evaluations_id_seq OWNER TO postgres;

--
-- TOC entry 6294 (class 0 OID 0)
-- Dependencies: 261
-- Name: utility_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utility_evaluations_id_seq OWNED BY public.utility_evaluations.id;


--
-- TOC entry 262 (class 1259 OID 44349)
-- Name: utility_ocr_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_ocr_results (
    id integer NOT NULL,
    application_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    saved_filename character varying(255) NOT NULL,
    file_url text NOT NULL,
    ocr_result jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.utility_ocr_results OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 44360)
-- Name: utility_ocr_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utility_ocr_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utility_ocr_results_id_seq OWNER TO postgres;

--
-- TOC entry 6295 (class 0 OID 0)
-- Dependencies: 263
-- Name: utility_ocr_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utility_ocr_results_id_seq OWNED BY public.utility_ocr_results.id;


--
-- TOC entry 264 (class 1259 OID 44361)
-- Name: violation_report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violation_report (
    violation_id integer NOT NULL,
    reported_by integer,
    violator_name character varying(100),
    address character varying(255),
    regulation character varying(255),
    specific_violation text,
    fine_penalty character varying(100),
    other_details text,
    noted_by character varying(100),
    date_reported date,
    violation_status character varying(20),
    attached_proof_image character varying(255),
    CONSTRAINT violation_report_violation_status_check CHECK (((violation_status)::text = ANY (ARRAY[('1st Warning'::character varying)::text, ('2nd Warning'::character varying)::text, ('Fine Issued'::character varying)::text, ('Resolved'::character varying)::text])))
);


ALTER TABLE public.violation_report OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 44368)
-- Name: violation_report_violation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.violation_report_violation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.violation_report_violation_id_seq OWNER TO postgres;

--
-- TOC entry 6296 (class 0 OID 0)
-- Dependencies: 265
-- Name: violation_report_violation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.violation_report_violation_id_seq OWNED BY public.violation_report.violation_id;


--
-- TOC entry 5890 (class 2604 OID 44369)
-- Name: archives archive_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archives ALTER COLUMN archive_id SET DEFAULT nextval('public.archives_archive_id_seq'::regclass);


--
-- TOC entry 5893 (class 2604 OID 44370)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 5970 (class 2604 OID 44588)
-- Name: barangay_boundaries boundary_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangay_boundaries ALTER COLUMN boundary_id SET DEFAULT nextval('public.barangay_boundaries_boundary_id_seq'::regclass);


--
-- TOC entry 5964 (class 2604 OID 44558)
-- Name: barangay_hazards hazard_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangay_hazards ALTER COLUMN hazard_id SET DEFAULT nextval('public.barangay_hazards_hazard_id_seq'::regclass);


--
-- TOC entry 5895 (class 2604 OID 44373)
-- Name: business_applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_applications ALTER COLUMN id SET DEFAULT nextval('public.business_applications_id_seq'::regclass);


--
-- TOC entry 5903 (class 2604 OID 44374)
-- Name: business_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_evaluations ALTER COLUMN id SET DEFAULT nextval('public.business_evaluations_id_seq'::regclass);


--
-- TOC entry 5906 (class 2604 OID 44375)
-- Name: business_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_files ALTER COLUMN id SET DEFAULT nextval('public.business_files_id_seq'::regclass);


--
-- TOC entry 5908 (class 2604 OID 44376)
-- Name: business_ocr_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_ocr_results ALTER COLUMN id SET DEFAULT nextval('public.business_ocr_results_id_seq'::regclass);


--
-- TOC entry 5910 (class 2604 OID 44377)
-- Name: construction_applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_applications ALTER COLUMN id SET DEFAULT nextval('public.construction_applications_id_seq'::regclass);


--
-- TOC entry 5916 (class 2604 OID 44378)
-- Name: construction_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_evaluations ALTER COLUMN id SET DEFAULT nextval('public.construction_evaluations_id_seq'::regclass);


--
-- TOC entry 5919 (class 2604 OID 44379)
-- Name: construction_ocr_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_ocr_results ALTER COLUMN id SET DEFAULT nextval('public.construction_ocr_results_id_seq'::regclass);


--
-- TOC entry 5959 (class 2604 OID 44544)
-- Name: fault_lines fault_line_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fault_lines ALTER COLUMN fault_line_id SET DEFAULT nextval('public.fault_lines_fault_line_id_seq'::regclass);


--
-- TOC entry 5967 (class 2604 OID 44572)
-- Name: house_polygons house_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.house_polygons ALTER COLUMN house_id SET DEFAULT nextval('public.house_polygons_house_id_seq'::regclass);


--
-- TOC entry 5921 (class 2604 OID 44382)
-- Name: incident_report_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_report_evaluations ALTER COLUMN id SET DEFAULT nextval('public.incident_report_evaluations_id_seq'::regclass);


--
-- TOC entry 5924 (class 2604 OID 44383)
-- Name: incident_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_reports ALTER COLUMN id SET DEFAULT nextval('public.incident_reports_id_seq'::regclass);


--
-- TOC entry 5930 (class 2604 OID 44384)
-- Name: ocr_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_jobs ALTER COLUMN id SET DEFAULT nextval('public.ocr_jobs_id_seq'::regclass);


--
-- TOC entry 5934 (class 2604 OID 44385)
-- Name: ocr_verifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_verifications ALTER COLUMN id SET DEFAULT nextval('public.ocr_verifications_id_seq'::regclass);


--
-- TOC entry 5936 (class 2604 OID 44386)
-- Name: resident resident_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resident ALTER COLUMN resident_id SET DEFAULT nextval('public.resident_resident_id_seq'::regclass);


--
-- TOC entry 5939 (class 2604 OID 44387)
-- Name: role role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role ALTER COLUMN role_id SET DEFAULT nextval('public.role_role_id_seq'::regclass);


--
-- TOC entry 5941 (class 2604 OID 44388)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5947 (class 2604 OID 44389)
-- Name: utility_applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_applications ALTER COLUMN id SET DEFAULT nextval('public.utility_applications_id_seq'::regclass);


--
-- TOC entry 5953 (class 2604 OID 44390)
-- Name: utility_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_evaluations ALTER COLUMN id SET DEFAULT nextval('public.utility_evaluations_id_seq'::regclass);


--
-- TOC entry 5956 (class 2604 OID 44391)
-- Name: utility_ocr_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_ocr_results ALTER COLUMN id SET DEFAULT nextval('public.utility_ocr_results_id_seq'::regclass);


--
-- TOC entry 5958 (class 2604 OID 44392)
-- Name: violation_report violation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_report ALTER COLUMN violation_id SET DEFAULT nextval('public.violation_report_violation_id_seq'::regclass);


--
-- TOC entry 6216 (class 0 OID 44087)
-- Dependencies: 225
-- Data for Name: archives; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archives (archive_id, table_name, record_id, supabase_user_id, archived_at, restored_at, is_restored, full_name, role_id, email) FROM stdin;
34	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:06:26.167757	2026-02-27 20:09:17.865592	t	Anderson Surville	1	jefersonmuring61@gmail.com
35	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:09:28.200843	2026-02-27 20:11:54.721766	t	Anderson Surville	1	jefersonmuring61@gmail.com
12	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-15 21:57:55.286983	2026-02-15 22:02:09.672329	t	Jeferson	1	jefersonmuring61@gmail.com
13	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-15 22:02:18.763709	2026-02-15 22:05:15.276835	t	Jeferson	1	jefersonmuring61@gmail.com
36	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:12:02.190189	2026-02-27 20:14:46.541189	t	Anderson Surville	1	jefersonmuring61@gmail.com
15	users	7	d8b70153-d844-42dd-b409-7a0c68b6f52e	2026-02-15 22:59:17.316934	2026-02-17 11:38:25.960077	t	Ronnel  Mateo	1	rvmateo71@gmail.com
16	users	7	d8b70153-d844-42dd-b409-7a0c68b6f52e	2026-02-17 11:38:41.124626	2026-02-17 11:38:47.751922	t	Ronnel  Mateo	1	rvmateo71@gmail.com
14	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-15 22:59:09.914976	2026-02-17 11:39:11.037832	t	Jeferson	1	jefersonmuring61@gmail.com
17	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-17 11:39:24.576279	2026-02-17 15:31:11.748843	t	Jeferson	1	jefersonmuring61@gmail.com
18	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-17 23:41:21.810981	2026-02-17 23:41:28.326933	t	Jeferson	1	jefersonmuring61@gmail.com
19	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-18 20:30:45.343335	2026-02-18 20:31:18.205258	t	Jeferson	1	jefersonmuring61@gmail.com
20	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-19 13:58:49.35142	2026-02-19 14:24:06.936843	t	Jeferson	1	jefersonmuring61@gmail.com
21	users	7	d8b70153-d844-42dd-b409-7a0c68b6f52e	2026-02-21 19:06:22.972998	2026-02-21 19:06:55.510513	t	Ronnel  Mateo	1	rvmateo71@gmail.com
25	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-21 19:20:11.750358	2026-02-21 19:20:35.100693	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
24	users	32	ad589606-6d2d-4044-9abd-452a13726acf	2026-02-21 19:20:03.426539	2026-02-21 19:20:36.541747	t	Jeferson	1	jefersonmuring61@gmail.com
23	users	7	d8b70153-d844-42dd-b409-7a0c68b6f52e	2026-02-21 19:16:26.452354	2026-02-21 19:20:40.415819	t	Ronnel  Mateo	1	rvmateo71@gmail.com
22	users	7	d8b70153-d844-42dd-b409-7a0c68b6f52e	2026-02-21 19:16:14.074592	2026-02-21 19:20:42.175246	t	Ronnel  Mateo	1	rvmateo71@gmail.com
26	users	7	d8b70153-d844-42dd-b409-7a0c68b6f52e	2026-02-21 19:20:53.273493	2026-02-21 19:21:03.711909	t	Ronnel  Mateo	1	rvmateo71@gmail.com
27	users	8	eb085d10-b018-42d4-ae19-e937970c5f8a	2026-02-21 19:31:45.226342	2026-02-21 19:31:59.658724	t	Ronnel  Mateo	1	leeparado123@gmail.com
28	users	6	118f9b57-5f1a-4bb4-bd3b-1953bce41e90	2026-02-21 20:12:05.457182	2026-02-21 20:12:26.907648	t	Ronnel  Mateo	1	mateo.ronnelvictor.bronio@gmail.com
29	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 18:35:19.328193	2026-02-27 18:37:15.366642	t	Anderson Surville	1	jefersonmuring61@gmail.com
30	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 18:37:26.436367	2026-02-27 18:45:19.826487	t	Anderson Surville	1	jefersonmuring61@gmail.com
31	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 18:45:44.42927	2026-02-27 18:54:05.454073	t	Anderson Surville	1	jefersonmuring61@gmail.com
32	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 18:53:29.600307	2026-02-27 18:54:12.232984	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
33	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 18:54:33.796059	2026-02-27 18:56:53.278657	t	Anderson Surville	1	jefersonmuring61@gmail.com
37	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 20:13:44.026321	2026-02-27 20:18:08.690183	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
38	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:31:30.80504	2026-02-27 20:39:16.965501	t	Anderson Surville	1	jefersonmuring61@gmail.com
39	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 20:39:06.2582	2026-02-27 20:40:48.542287	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
40	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:43:42.256721	2026-02-27 20:46:11.360043	t	Anderson Surville	1	jefersonmuring61@gmail.com
41	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 20:46:00.596263	2026-02-27 20:48:20.464525	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
43	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 20:51:52.761508	2026-02-27 20:52:58.700214	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
44	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 20:53:12.649608	2026-02-27 20:53:50.744719	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
45	users	9	08c4118e-1f53-4705-8246-23f301a1005b	2026-02-27 20:53:59.098674	2026-02-27 20:54:27.861695	t	Jeferson Muring	2	jeffmuring12@gmail.com
42	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:51:15.99893	2026-02-27 20:54:30.314622	t	Anderson Surville	1	jefersonmuring61@gmail.com
46	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:55:43.344923	2026-02-27 20:56:00.589366	t	Anderson Surville	1	jefersonmuring61@gmail.com
47	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 20:56:19.256411	2026-02-27 21:30:46.20611	t	Anderson Surville	1	jefersonmuring61@gmail.com
48	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 21:09:14.981456	2026-02-27 21:32:44.628885	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
49	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 21:32:50.757937	2026-02-27 21:41:46.730687	t	Anderson Surville	1	jefersonmuring61@gmail.com
50	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 21:43:15.257729	2026-02-27 21:43:21.355385	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
51	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 21:44:51.692824	2026-02-27 21:44:56.565756	t	Anderson Surville	1	jefersonmuring61@gmail.com
52	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 21:47:30.580302	2026-02-27 21:47:35.48507	t	Anderson Surville	1	jefersonmuring61@gmail.com
53	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 21:54:03.673748	2026-02-27 21:54:10.226814	t	Anderson Surville	1	jefersonmuring61@gmail.com
56	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 22:18:36.27389	2026-02-27 22:28:23.546682	t	Anderson Surville	1	jefersonmuring61@gmail.com
54	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 21:57:58.519833	2026-02-27 21:58:23.484905	t	Anderson Surville	1	jefersonmuring61@gmail.com
58	users	9	08c4118e-1f53-4705-8246-23f301a1005b	2026-02-27 22:26:54.433164	2026-02-27 22:28:14.898114	t	Jeferson Muring	2	jeffmuring12@gmail.com
57	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 22:20:23.586788	2026-02-27 22:28:21.369921	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
55	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 21:58:20.675815	2026-02-27 22:28:25.047614	t	Anderson Surville	1	jefersonmuring61@gmail.com
60	users	2	db1d1ed3-3042-48ce-8b1e-b371402836f5	2026-02-27 22:29:22.444261	2026-02-27 22:39:00.454502	t	Jeferson Ismael Muring jr	1	muring.jeferson.ismael@gmail.com
59	users	34	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	2026-02-27 22:28:37.36499	2026-02-27 22:39:04.382249	t	Anderson Surville	1	jefersonmuring61@gmail.com
61	users	9	08c4118e-1f53-4705-8246-23f301a1005b	2026-02-27 22:34:24.993567	2026-02-27 22:49:56.236393	t	Jeferson Muring	2	jeffmuring12@gmail.com
62	users	41	d1b6349d-f242-458e-b576-42fb8bbe0f5d	2026-03-05 03:21:26.150566	2026-03-05 03:21:39.723398	t	Jeferson Ismael Muring	1	muring.jeferson.ismael@gmail.com
63	users	42	a44e109d-622d-437d-bb0c-e7e32daafe4a	2026-03-05 12:46:00.786071	2026-03-05 12:46:12.164267	t	Jeferson Ismael Muring	1	muring.jeferson.ismael@gmail.com
\.


--
-- TOC entry 6218 (class 0 OID 44100)
-- Dependencies: 227
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, supabase_user_id, role_id, category, action, table_name, record_id, old_data, new_data, created_at, full_name) FROM stdin;
243	08c4118e-1f53-4705-8246-23f301a1005b	2	\N	UPDATE	users	41	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": null, "status": "active", "street": null, "suffix": null, "role_id": 1, "user_id": 41, "latitude": null, "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": null, "created_at": "2026-03-05 02:49:56.838546", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": null, "suspend_reason": null, "suspended_until": null, "supabase_user_id": "d1b6349d-f242-458e-b576-42fb8bbe0f5d"}	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "6", "street": "Colonel Bonny Serrano Ave.", "role_id": "1", "latitude": "14.616583", "full_name": "Jeferson Ismael Muring", "longitude": "121.075831"}	2026-03-05 03:20:17.373264	Jeferson Ismael Muring
244	08c4118e-1f53-4705-8246-23f301a1005b	2	USER	SUSPEND	users	41	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "6", "status": "active", "street": "Colonel Bonny Serrano Ave.", "suffix": null, "role_id": 1, "user_id": 41, "latitude": "14.61658300", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07583100", "created_at": "2026-03-05 02:49:56.838546", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": null, "suspend_reason": null, "suspended_until": null, "supabase_user_id": "d1b6349d-f242-458e-b576-42fb8bbe0f5d"}	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "6", "status": "suspended", "street": "Colonel Bonny Serrano Ave.", "suffix": null, "role_id": 1, "user_id": 41, "latitude": "14.61658300", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07583100", "created_at": "2026-03-05 02:49:56.838546", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": "User displayed behavior inconsistent with normal activity.", "suspend_reason": "Suspicious or Unusual Activity", "suspended_until": "2026-03-11 19:21:02+08", "supabase_user_id": "d1b6349d-f242-458e-b576-42fb8bbe0f5d"}	2026-03-05 03:21:02.208588	Jeferson Ismael Muring
245	08c4118e-1f53-4705-8246-23f301a1005b	2	ARCHIVE	ARCHIVE	users	41	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "6", "status": "suspended", "street": "Colonel Bonny Serrano Ave.", "suffix": null, "role_id": 1, "user_id": 41, "latitude": "14.61658300", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07583100", "created_at": "2026-03-05 02:49:56.838546", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": "User displayed behavior inconsistent with normal activity.", "suspend_reason": "Suspicious or Unusual Activity", "suspended_until": "2026-03-11 19:21:02+08", "supabase_user_id": "d1b6349d-f242-458e-b576-42fb8bbe0f5d"}	\N	2026-03-05 03:21:26.184572	Jeferson Ismael Muring
246	08c4118e-1f53-4705-8246-23f301a1005b	2	ARCHIVE	RESTORE	users	41	\N	{"email": "muring.jeferson.ismael@gmail.com", "role_id": 1, "full_name": "Jeferson Ismael Muring", "record_id": 41, "archive_id": 62, "table_name": "users", "archived_at": "2026-03-05 03:21:26.150566", "is_restored": false, "restored_at": null, "supabase_user_id": "d1b6349d-f242-458e-b576-42fb8bbe0f5d"}	2026-03-05 03:21:39.724959	Jeferson Ismael Muring
247	08c4118e-1f53-4705-8246-23f301a1005b	2	USER	UNSUSPEND	users	41	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "6", "status": "suspended", "street": "Colonel Bonny Serrano Ave.", "suffix": null, "role_id": 1, "user_id": 41, "latitude": "14.61658300", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07583100", "created_at": "2026-03-05 02:49:56.838546", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": "User displayed behavior inconsistent with normal activity.", "suspend_reason": "Suspicious or Unusual Activity", "suspended_until": "2026-03-11 19:21:02+08", "supabase_user_id": "d1b6349d-f242-458e-b576-42fb8bbe0f5d"}	\N	2026-03-05 03:22:22.456059	Jeferson Ismael Muring
248	08c4118e-1f53-4705-8246-23f301a1005b	2	\N	UPDATE	users	42	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": null, "status": "active", "street": null, "suffix": null, "role_id": 1, "user_id": 42, "latitude": null, "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": null, "created_at": "2026-03-05 12:29:44.981688", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": null, "suspend_reason": null, "suspended_until": null, "supabase_user_id": "a44e109d-622d-437d-bb0c-e7e32daafe4a"}	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "5", "street": "Twin Peaks Dr", "role_id": "1", "latitude": "14.617141", "full_name": "Jeferson Ismael Muring", "longitude": "121.074825"}	2026-03-05 12:45:18.87167	Jeferson Ismael Muring
249	08c4118e-1f53-4705-8246-23f301a1005b	2	USER	SUSPEND	users	42	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "5", "status": "active", "street": "Twin Peaks Dr", "suffix": null, "role_id": 1, "user_id": 42, "latitude": "14.61714100", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07482500", "created_at": "2026-03-05 12:29:44.981688", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": null, "suspend_reason": null, "suspended_until": null, "supabase_user_id": "a44e109d-622d-437d-bb0c-e7e32daafe4a"}	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "5", "status": "suspended", "street": "Twin Peaks Dr", "suffix": null, "role_id": 1, "user_id": 42, "latitude": "14.61714100", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07482500", "created_at": "2026-03-05 12:29:44.981688", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": "User submitted content that violates platform guidelines.", "suspend_reason": "Violation of Terms of Service", "suspended_until": "2026-03-12 04:45:36+08", "supabase_user_id": "a44e109d-622d-437d-bb0c-e7e32daafe4a"}	2026-03-05 12:45:36.655548	Jeferson Ismael Muring
250	08c4118e-1f53-4705-8246-23f301a1005b	2	ARCHIVE	ARCHIVE	users	42	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "5", "status": "suspended", "street": "Twin Peaks Dr", "suffix": null, "role_id": 1, "user_id": 42, "latitude": "14.61714100", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07482500", "created_at": "2026-03-05 12:29:44.981688", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": "User submitted content that violates platform guidelines.", "suspend_reason": "Violation of Terms of Service", "suspended_until": "2026-03-12 04:45:36+08", "supabase_user_id": "a44e109d-622d-437d-bb0c-e7e32daafe4a"}	\N	2026-03-05 12:46:00.796253	Jeferson Ismael Muring
251	08c4118e-1f53-4705-8246-23f301a1005b	2	ARCHIVE	RESTORE	users	42	\N	{"email": "muring.jeferson.ismael@gmail.com", "role_id": 1, "full_name": "Jeferson Ismael Muring", "record_id": 42, "archive_id": 63, "table_name": "users", "archived_at": "2026-03-05 12:46:00.786071", "is_restored": false, "restored_at": null, "supabase_user_id": "a44e109d-622d-437d-bb0c-e7e32daafe4a"}	2026-03-05 12:46:12.166724	Jeferson Ismael Muring
252	08c4118e-1f53-4705-8246-23f301a1005b	2	USER	UNSUSPEND	users	42	{"email": "muring.jeferson.ismael@gmail.com", "lot_no": "5", "status": "suspended", "street": "Twin Peaks Dr", "suffix": null, "role_id": 1, "user_id": 42, "latitude": "14.61714100", "password": null, "username": null, "full_name": "Jeferson Ismael Muring", "last_name": null, "longitude": "121.07482500", "created_at": "2026-03-05 12:29:44.981688", "first_name": null, "is_archived": false, "middle_name": null, "ocr_verified": null, "reason_details": "User submitted content that violates platform guidelines.", "suspend_reason": "Violation of Terms of Service", "suspended_until": "2026-03-12 04:45:36+08", "supabase_user_id": "a44e109d-622d-437d-bb0c-e7e32daafe4a"}	\N	2026-03-05 12:48:55.016432	Jeferson Ismael Muring
\.


--
-- TOC entry 6263 (class 0 OID 44578)
-- Dependencies: 272
-- Data for Name: barangay_boundaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barangay_boundaries (boundary_id, name, description, coordinates, created_at) FROM stdin;
2	Barangay Blue Ridge B	\N	[[121.07397241882286, 14.616215224294894], [121.07354984995001, 14.616434893575976], [121.07325743306576, 14.616573645525841], [121.07377811097767, 14.61782757441852], [121.07481602344237, 14.620038323968238], [121.07516783581373, 14.620210233414989], [121.07552809902211, 14.620072109623935], [121.07581649182076, 14.619808874060977], [121.07579741809268, 14.619602217016254], [121.07809374719531, 14.61845826610326], [121.07766182353126, 14.617775764015963], [121.07657263770558, 14.61764349652779], [121.07623193179462, 14.616546451350468], [121.07607770121434, 14.616470297105465], [121.07541506845833, 14.61632246785264], [121.07442926348578, 14.616353627989072]]	2026-02-25 01:12:00.966465
\.


--
-- TOC entry 6259 (class 0 OID 44549)
-- Dependencies: 268
-- Data for Name: barangay_hazards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barangay_hazards (hazard_id, hazard_type, hazard_name, risk_level, description, geom, properties, created_at, updated_at) FROM stdin;
6	flood	Low Risk Area	low		0103000020E61000000100000017000000F3D66D0EC7445E403D0E7A4D913B2D40F62CF68CC8445E40283BE1E3BF3B2D40412C8F08CD445E40D105A1A0ED3B2D4046493C2ACF445E40E05E93AD113C2D4066B2C0F4CF445E4055C9C33E3F3C2D4009BF64AED0445E405D829158443C2D40F490C72FD1445E4026B99EBA573C2D40E0622AB1D1445E40B0C72042943C2D40A1CAFBCFD4445E4040160647D03C2D407CEF40BCD5445E40EBFFDCAEF53C2D40F2741965D4445E4017260E02173D2D40E7393219D3445E407B405C78693D2D40488316DED3445E408EE19F8D7E3D2D40B025646AD5445E403F6340307A3D2D4004C9FF32DA445E40F30E6BC2573D2D401A2D65EBD9445E405BBBCD6F3C3D2D4026BCC383FF445E40D604E7B6A63C2D4028C90C76F8445E4050A850E24C3C2D408A43B098E6445E401AD95D5E3B3C2D40204E560AE1445E40EF9A16FDAB3B2D40DADFCA7EDE445E40F47D5B74A13B2D40B33BA2A2D3445E400344FCE48D3B2D40F3D66D0EC7445E403D0E7A4D913B2D40	{"source": "Barangay Blue Ridge B", "created_at": "2026-02-25 15:09:29", "updated_by": "::1", "created_via": "flood_editor"}	2026-02-25 23:09:29.177738	2026-02-25 23:09:29.177738
7	flood	Medium Risk Area	medium		0103000020E610000001000000180000002EE0DD18E9445E408D8173FB3D3C2D40A2E381EAE7445E4021A9245D553C2D40BB86EB56E5445E40F1E628D35B3C2D4066A3E548E4445E4056CD3E16693C2D40F810C3D2E3445E40B9A1F1B0743C2D4095BC1D4DE4445E40DCD1889D7F3C2D4021E6519DE3445E40A1F2F790853C2D40E6EDE614E3445E409F7127538C3C2D4019889E02E3445E40C5EB1B66963C2D4058E4E86EE3445E4087C34FAA9F3C2D40AA6079F4E4445E40E86A83EEA83C2D404E6A8709E6445E4068DE9CEEBB3C2D409AC549B2E6445E40AE04BD39C03C2D40B31BE29FE9445E401F973C6DB73C2D40C7C2D3EBE9445E407F6801BEBA3C2D40092ADF18E9445E40CC072C97D03C2D40043F5402EA445E40908CB9BAD93C2D405B7A0A05EB445E40A30445A6E73C2D4033A57B3AEB445E40084C3408E83C2D4094C965EEED445E40EC263751DB3C2D40413F7E03EE445E4049FCDC42D43C2D40DB68FFBEFD445E406ADBE8C08F3C2D4038125173F8445E40DF009B014D3C2D402EE0DD18E9445E408D8173FB3D3C2D40	{"source": "Barangay Blue Ridge B", "created_at": "2026-02-25 15:21:46", "updated_by": "::1", "created_via": "flood_editor"}	2026-02-25 23:21:46.309426	2026-02-25 23:21:46.309426
8	flood	High Risk Area	high		0103000020E6100000010000001400000012245FF5ED445E40874B7872423C2D408ECBAB53ED445E40EF762752593C2D40C8C316DCED445E401E18D0FF6E3C2D4067F386E4ED445E40320EA5E2753C2D4053D340CBEC445E40D70A48EB7D3C2D40926B6FACE9445E4072A128EA813C2D40B07BD553E9445E40A48CF84A863C2D40D5CFE434E9445E4082012B548C3C2D40E7F2C0F2E9445E40436D36C29B3C2D408978B979EB445E40D6C171CFA63C2D40203989DDEC445E4026CEAFC5A23C2D406546810AEE445E40A0C22523AB3C2D4071816856EF445E400165AD16C43C2D40D839EDBFEE445E40F35568C1D03C2D40BB100F30F6445E40DD0EEB47B83C2D40B5172DB4F8445E40B05FCE5EB43C2D40BEE31449FB445E40CDCAE672B03C2D40CC4EB40DFF445E401E1C566BA03C2D40EE00297DF8445E40490034C04C3C2D4012245FF5ED445E40874B7872423C2D40	{"source": "Barangay Blue Ridge B", "created_at": "2026-02-25 15:25:51", "updated_by": "::1", "created_via": "flood_editor"}	2026-02-25 23:25:51.766484	2026-02-25 23:25:51.766484
\.


--
-- TOC entry 6220 (class 0 OID 44130)
-- Dependencies: 229
-- Data for Name: business_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_applications (id, business_name, type_of_business, nature_of_business, nature_of_business_specify, address_of_business, business_status, telephone_no_business, email_address, first_name, middle_name, last_name, telephone_no_owner, address_owner, type_of_structure, type_of_structure_specify, no_of_employees, requirements, requirement_upload, status, approval_comments, disapproval_reason, application_date, created_at, updated_at, payment_status, amount_due, amount_paid, or_number, payment_date, payment_method, supabase_user_id, latitude, longitude, dss_status, suffix, nature_of_application, requirement_upload_json) FROM stdin;
3	Jeferson's Gymnasium	Partnership	Services	\N	14 Riverview Dr	[]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Jeferson	\N	Muring	09474277177	20 Moonlight Loop	Warehouse	\N	6	"[\\"Previous Business Permit\\"]"	server/api/resident/uploads/payment_proofs/proof_693f0507ee0d0.png	Approved	For Claiming of Clearance	\N	2025-12-15	2025-12-15 02:21:20.842229	2025-12-15 02:44:16.068032	Paid	1000.00	1000.00	\N	2025-12-15 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61846400	121.07783000	\N	\N	\N	[]
4	Lance Meatery	Partnership	Retailing	\N	4 Union Lane	[]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Ronnel	\N	Mateo	09474277177	3 Moonlight Loop	Store	\N	3	"[\\"Previous Business Permit\\"]"	server/api/resident/uploads/payment_proofs/proof_693fc75f4317c.png	Approved	all good	\N	2025-12-15	2025-12-15 16:11:53.329889	2025-12-15 16:36:49.99865	Paid	1000.00	1000.00	OR-2025-00006	2025-12-15 00:00:00	Cash (Over-the-Counter)	eb085d10-b018-42d4-ae19-e937970c5f8a	14.61803500	121.07369900	\N	\N	\N	[]
8	Victor Vape Shop 2026	Single Proprietorship	Manufacturing	\N	1 Union Lane	["Owned"]	34242342343	lance@gmail.com	Jeferson Ismael Muring jr	\N	d	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1768327104_test_valid_id1102.jpg	Pending	\N	\N	2026-01-14	2026-01-14 01:58:24.497758	2026-01-14 01:58:24.497758	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61767400	121.07391700	\N	\N	\N	[]
9	Loopy	Corporation	Manufacturing	\N	9 Moonlight Loop	["Owned"]	09123412342	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1768756187_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Pending	\N	\N	2026-01-19	2026-01-19 01:09:47.097695	2026-01-19 01:09:47.097695	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61943000	121.07510400	\N	\N	\N	[]
2	Oly's Protein	Partnership	Retailing	\N	17 Hillside Dr	[]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Ronnel	\N	Mateo	09474277177	2 Crest line St	Store	\N	3	"[\\"Lease Contract\\"]"	1765734824_Barangay Blue Ridge B - Business Clearance.pdf	Additional Requirements	Missing valid ID or DTI. Please re-upload.	\N	2025-12-15	2025-12-15 01:36:52.903806	2025-12-15 01:53:44.696153	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.62000600	121.07469000	\N	\N	\N	[]
1	Chair's Shop 1	Single Proprietorship	Retailing	\N		[]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Ronnel	\N	Mateo	09474277177	2 Crest line St	Store	\N	3	"[\\"Previous Business Permit\\"]"	1768833722_localhost_8080_Banwa_client_pages_resident_construction_app.php (1).png	Complied	Processing Fee	\N	2025-12-15	2025-12-15 01:35:43.718064	2026-01-19 22:42:02.86456	Pending Verification	1000.00	1000.00	\N	2026-01-12 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61641100	121.07304900	\N	\N	\N	[]
24	Victors Vape	Partnership	Manufacturing	\N	23 Twin Peaks Dr	["Leased"]	09781234534	ronnel@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Office	\N	23	["Previous Business Permit"]	1769176107_valid_id_test.jpg	Pending	\N	\N	2026-01-23	2026-01-23 21:48:27.364579	2026-01-23 21:48:27.364579	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	\N	Jr	\N	[]
27	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	\N	3 Union Lane	["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Warehouse	\N	3	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-23	2026-01-23 22:42:47.481402	2026-01-23 22:42:47.481402	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61797100	121.07385400	\N	Jr	\N	[]
28	Keki Shop	Partnership	Services	\N	2 Evening Glow Rd	["Rent-Free"]	09878634123	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Warehouse	\N	3	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-24	2026-01-24 17:53:47.665767	2026-01-24 17:53:47.665767	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61807000	121.07617100	\N	Jr	\N	[]
29	Solomon's Shop	Single Proprietorship	Manufacturing	\N	2 Evening Glow Rd	["Owned"]	09789761233	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Warehouse	\N	3	["Previous Business Permit"]	1769248576_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 17:56:16.363171	2026-01-24 17:56:16.363171	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61807000	121.07617100	\N	Jr	\N	[]
31	asdf	Corporation	Manufacturing	\N	5 Promenade Ln	["Leased"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	23	["Previous Business Permit"]	1769249145_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 18:05:45.921816	2026-01-24 18:05:45.921816	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61844900	121.07663700	\N	Jr	\N	[]
32	asdf	Single Proprietorship	Manufacturing	\N	8 Moonlight Loop	["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1769249437_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 18:10:37.999605	2026-01-24 18:10:37.999605	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61927300	121.07503900	\N	Jr	\N	[]
33	asdf	Single Proprietorship	Manufacturing	\N	15 Moonlight Loop	["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1769250753_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 18:32:33.594492	2026-01-24 18:32:33.594492	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61922400	121.07462500	Additional Requirements Needed	Jr	\N	[]
34	Perfect Business	Single Proprietorship	Retailing	\N	2 Comets Loop	["Owned"]	09123456789	perfect@gmail.com	Jeferson	Putorez	Oliven	09123412341	1 Comets Loop	Store	\N	3	["SEC","DTI","TCT","Lease Contract"]	1769252389_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 18:59:49.29958	2026-01-24 18:59:49.29958	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61673600	121.07405400	Additional Requirements Needed	Jr	\N	[]
35	Problematic Business	Single Proprietorship	Retailing	\N	2 Comets Loop	["Owned"]	09123456789	bad@gmail.com	Jeferson	Putorez	Oliven	09123412341	1 Comets Loop	Store	\N	20	["DTI"]	1769252577_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 19:02:57.955285	2026-01-24 19:02:57.955285	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61673600	121.07405400	Additional Requirements Needed	Jr	\N	[]
36	Perfect Business	Single Proprietorship	Retailing	\N	2 Comets Loop	["Owned"]	09123456789	perfect@example.com	Jeferson	Putorez	Oliven	09123412341	1 Comets Loop	Store	\N	3	["SEC","DTI","TCT","Lease Contract"]	1769252755_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 19:05:55.552729	2026-01-24 19:05:55.552729	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61673600	121.07405400	Additional Requirements Needed	Jr	\N	[]
37	Perfect Store	Single Proprietorship	Retailing	\N	15 Milkyway Dr	["Owned"]	09123456789	perfect@example.com	Jeferson	Putorez	Oliven	09123412341	5 Twin Peaks Dr	Store	\N	3	["SEC","DTI","TCT","Lease Contract"]	1769252907_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 19:08:27.794354	2026-01-24 19:08:27.794354	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61755900	121.07591300	Additional Requirements Needed	Jr	\N	[]
19	Hardware Store	Single Proprietorship	Wholesale/Repacking	\N		[]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341		Residence	\N	23	["[\\"[\\\\\\"Previous Business Permit\\\\\\"]\\"]"]	1769163018_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Complied	Missing valid ID or DTI. Please re-upload.	\N	2026-01-23	2026-01-23 18:08:25.018649	2026-01-23 23:45:52.556826	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61953000	121.07556500	Additional Requirements Needed	Jr	\N	[]
39	Cruz Retail Store	Single Proprietorship	Retailing	\N	15 Moonlight Loop	["Owned"]	09123456789	juan.cruz@example.com	Jeferson	Putorez	Oliven	09123412341	15 Moonlight Loop	Store	\N	3	["SEC","DTI","TCT","Lease Contract"]	1769253595_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 19:19:55.433791	2026-01-24 19:19:55.433791	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61922400	121.07462500	Additional Requirements Needed	Jr	\N	[]
40	Cruz Retail Store	Single Proprietorship	Retailing	\N	15 Moonlight Loop	["Owned"]	09123456789	juan.cruz@example.com	Jeferson	Putorez	Oliven	09123412341	15 Moonlight Loop	Store	\N	3	["SEC","DTI","TCT","Lease Contract"]	1769253740_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 19:22:20.613486	2026-01-24 19:22:20.613486	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61922400	121.07462500	Pre-Approved	Jr	\N	[]
41	Test 1101	Single Proprietorship	Retailing	\N	5 Riverview Dr	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	23	["Previous Business Permit"]	1769258778_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 20:46:18.684743	2026-01-24 20:46:18.684743	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61764500	121.07623800	Pre-Approved	Jr	\N	[]
42	Test 1101	Partnership	Retailing	\N	21 Twin Peaks Dr	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	35	["Previous Business Permit"]	1769260282_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 21:11:22.059234	2026-01-24 21:11:22.059234	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61744400	121.07472100	Additional Requirements Needed	Jr	\N	[]
43	Test 1101	Corporation	Rentals	\N	24 Milkyway Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	35	["Previous Business Permit"]	1769261953_valid_id_test.jpg	Pending	\N	\N	2026-01-24	2026-01-24 21:39:13.742678	2026-01-24 21:39:13.742678	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61699900	121.07528600	Additional Requirements Needed	Jr	\N	[]
5	Chair's Shop 2	Single Proprietorship	Manufacturing	\N	13 Hillside Dr	["Owned"]	34242342343	lance@gmail.com	Jeferson	\N	Malana	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1768292214_test_valid_id1102.jpg	Pending	\N	\N	2026-01-13	2026-01-13 16:16:54.984072	2026-01-13 16:16:54.984072	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61916600	121.07431100	\N	\N	\N	[]
6	Salamin Shop 1	Single Proprietorship	Manufacturing	\N	11 Hillside Dr	["Owned"]	34242342343	lance@gmail.com	Jeferson	\N	Soliridad	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1768292860_test_valid_id1102.jpg	Pending	\N	\N	2026-01-13	2026-01-13 16:27:40.877736	2026-01-13 16:27:40.877736	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61884200	121.07414100	\N	\N	\N	[]
7	Salamin Shop 2	Single Proprietorship	Manufacturing	\N	8 Hillside Dr	["Owned"]	34242342343	lance@gmail.com	Jeferson	\N	Boctoy	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1768292967_test_valid_id1102.jpg	Pre-Approved	Missing valid ID or DTI. Please re-upload.	\N	2026-01-13	2026-01-13 16:29:27.474981	2026-01-13 16:29:27.474981	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61833600	121.07391500	\N	\N	\N	[]
10	Asadez 1	Single Proprietorship	Manufacturing	\N		["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341		Residence	\N	23	"[\\"Previous Business Permit\\"]"	1769150964_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	Complied	Missing valid ID or DTI. Please re-upload.	\N	2026-01-23	2026-01-23 14:49:24.037127	2026-01-23 14:50:36.229188	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61767300	121.07525100	\N	\N	\N	[]
11	Asadez 2	Single Proprietorship	Manufacturing	\N		[]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341		Residence	\N	23	"[\\"Previous Business Permit\\"]"	1769151472_localhost_8080_Banwa_client_pages_staff_business_staff_business.php.png	Complied	Missing valid ID or DTI. Please re-upload.	\N	2026-01-23	2026-01-23 14:56:27.535428	2026-01-23 14:57:52.120385	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61684500	121.07572800	\N	\N	\N	[]
12	Asadez 3	Single Proprietorship	Manufacturing	\N		[]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341		Residence	\N	3	"[\\"Previous Business Permit\\"]"	server/api/resident/uploads/payment_proofs/proof_6973240063846.png	Approved	Application is complete. Proceed to payment.	\N	2026-01-23	2026-01-23 15:29:46.792542	2026-01-23 15:34:36.786428	Paid	1000.00	1000.00	\N	2026-01-23 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61672300	121.07553500	\N	\N	\N	[]
13	Salamin Shop 3	Single Proprietorship	Manufacturing	\N	15 Comets Loop	["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	\N	["Previous Business Permit"]	1769154659_localhost_8080_Banwa_client_pages_staff_business_staff_business.php.png	pre-approved	\N	\N	2026-01-23	2026-01-23 15:50:59.766386	2026-01-23 15:50:59.766386	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61671800	121.07531900	\N	\N	\N	[]
14	Salamin Shop 4	Single Proprietorship	Manufacturing	\N	15 Comets Loop	["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	\N	["Previous Business Permit"]	1769154665_localhost_8080_Banwa_client_pages_staff_business_staff_business.php.png	pre-approved	\N	\N	2026-01-23	2026-01-23 15:51:05.690376	2026-01-23 15:51:05.690376	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61671800	121.07531900	\N	\N	\N	[]
15	Hardware Store	Partnership	Manufacturing	\N	5 Riverview Dr	["Leased"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Factory	\N	2	["Previous Business Permit"]	1769160297_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Pending	\N	\N	2026-01-23	2026-01-23 17:24:57.850923	2026-01-23 17:24:57.850923	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61764500	121.07623800	\N	Jr	\N	[]
16	Hardware Store	Single Proprietorship	Services	\N		[]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341		Office	\N	23	["[\\"Previous Business Permit\\"]"]	1769161384_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Complied	Missing valid ID or DTI. Please re-upload.	\N	2026-01-23	2026-01-23 17:40:48.853725	2026-01-23 17:43:04.404436	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61882400	121.07552000	\N	Jr	\N	[]
17	Salamin Shop 5	Partnership	Manufacturing	\N	5 Promenade Ln	["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	23	["Previous Business Permit"]	1769162156_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Pending	\N	\N	2026-01-23	2026-01-23 17:55:56.095751	2026-01-23 17:55:56.095751	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61844900	121.07663700	\N	Jr	\N	[]
18	Hardware Store	Single Proprietorship	Retailing	\N	5 Twin Peaks Dr	["Rent-Free"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	35	["Previous Business Permit"]	1769162634_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Pending	\N	\N	2026-01-23	2026-01-23 18:03:54.847542	2026-01-23 18:03:54.847542	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714100	121.07482500	\N	Jr	\N	[]
20	Hardware Store	Partnership	Manufacturing	\N		[]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341		Warehouse	\N	35	["[\\"Previous Business Permit\\"]"]	1769163506_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Complied	Missing valid ID or DTI. Please re-upload.	\N	2026-01-23	2026-01-23 18:17:20.039146	2026-01-23 18:18:26.581933	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61699900	121.07528600	Additional Requirements Needed	Jr	\N	[]
21	Hardware Store	Partnership	Services	\N	8 Colonel Bonny Serrano Ave.	["Leased"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1769163635_localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	Pending	\N	\N	2026-01-23	2026-01-23 18:20:35.639596	2026-01-23 18:20:35.639596	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61624500	121.07380400	Additional Requirements Needed	Jr	\N	[]
22	Hardware Store	Partnership	Services	\N	8 Colonel Bonny Serrano Ave.	["Leased"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1769163746_valid_id_test.jpg	Pending	\N	\N	2026-01-23	2026-01-23 18:22:27.002637	2026-01-23 18:22:27.002637	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61624500	121.07380400	Additional Requirements Needed	Jr	\N	[]
23	Salamin Shop 6	Corporation	Retailing	\N	10 Comets Loop	["Owned"]	34242342343	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Office	\N	23	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-23	2026-01-23 20:16:09.219468	2026-01-23 20:16:09.219468	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61756400	121.07439800	\N	Jr	\N	[]
25	Ronnel's Vape Shop 1	Single Proprietorship	Services	\N	5 Colonel Bonny Serrano Ave.	["Rent-Free"]	09123423423	ronnel@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	23	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-23	2026-01-23 22:01:45.514642	2026-01-23 22:01:45.514642	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61650000	121.07569000	\N	Jr	\N	[]
26	Ronnel's Vape Shop 2	Partnership	Retailing	\N	5 Comets Loop	["Leased"]	09898823215	ronnel@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Office	\N	4	["Previous Business Permit"]	1769176999_valid_id_test.jpg	Pending	\N	\N	2026-01-23	2026-01-23 22:03:19.787115	2026-01-23 22:03:19.787115	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	\N	Jr	\N	[]
44	sdfg	Single Proprietorship	Manufacturing	\N	1 Crest line St	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	1769352148_localhost_8080_Banwa_client_pages_resident_construction_app.php (1).png	Pending	\N	\N	2026-01-25	2026-01-25 22:42:28.649012	2026-01-25 22:42:28.649012	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61644400	121.07331200	Pre-Approved	Jr	\N	[]
45	Gambling	Partnership	Retailing	\N	5 Colonel Bonny Serrano Ave.	["Rent-Free"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	35	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-26	2026-01-26 18:49:20.440039	2026-01-26 18:49:20.440039	Unpaid	0.00	0.00	\N	\N	\N	\N	14.61650000	121.07569000	Additional Requirements Needed	Jr	\N	[]
50	Laptop Shop ni YD	Single Proprietorship	Retailing	\N	23 Milkyway Dr	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	4	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-26	2026-01-26 19:16:11.314153	2026-01-26 19:16:11.314153	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61722600	121.07531600	Pre-Approved	Jr	\N	[]
47	Kala Shop	Partnership	Manufacturing	\N	15 Milkyway Dr	["Rent-Free"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Moonlight Loop	Office	\N	23	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-26	2026-01-26 19:05:03.723102	2026-01-26 19:05:03.723102	Unpaid	0.00	0.00	\N	\N	\N	\N	14.61755900	121.07591300	Additional Requirements Needed	Jr	\N	[]
48	Test 1101	Corporation	Manufacturing	\N	2 Evening Glow Rd	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Office	\N	35	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-26	2026-01-26 19:06:48.409711	2026-01-26 19:06:48.409711	Unpaid	0.00	0.00	\N	\N	\N	\N	14.61807000	121.07617100	Additional Requirements Needed	Jr	\N	[]
49	Test 1101	Single Proprietorship	Manufacturing	\N	2 Union Lane	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	35	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-26	2026-01-26 19:07:41.863639	2026-01-26 19:07:41.863639	Unpaid	0.00	0.00	\N	\N	\N	\N	14.61779300	121.07364600	Pre-Approved	Jr	\N	[]
46	Ses Shop	Partnership	Manufacturing	\N		[]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341		Residence	\N	23	["[\\"Previous Business Permit\\"]"]	\N	Complied	Missing valid ID or DTI. Please re-upload.	\N	2026-01-26	2026-01-26 18:53:04.27144	2026-01-26 19:12:52.653715	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61754000	121.07384800	Additional Requirements Needed	Jr	\N	[]
54	Santa Store	Single Proprietorship	Retailing	\N	21 Twin Peaks Dr	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-26	2026-01-26 20:21:59.73325	2026-01-26 20:21:59.73325	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61744400	121.07472100	Pre-Approved	Jr	\N	[]
51	Test 1101	Partnership	Retailing	\N	15 Comets Loop	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	\N	Additional Requirements	Missing valid ID or DTI. Please re-upload.	\N	2026-01-26	2026-01-26 19:43:34.154003	2026-01-26 19:43:34.154003	Unpaid	0.00	0.00	\N	\N	\N	\N	14.61661500	121.07361200	Additional Requirements Needed	Jr	\N	[]
52	Test 1101	Partnership	Retailing	\N	15 Comets Loop	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	1769427990_localhost_8080_Banwa_client_pages_resident_services.php.png	Pending	\N	\N	2026-01-26	2026-01-26 19:46:30.301461	2026-01-26 19:46:30.301461	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61661500	121.07361200	Additional Requirements Needed	Jr	\N	[]
53	Gift Store	Partnership	Retailing	\N	2 Colonel Bonny Serrano Ave.	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	4	["Previous Business Permit"]	\N	Pending	\N	\N	2026-01-26	2026-01-26 19:56:09.504794	2026-01-26 19:56:09.504794	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61650700	121.07499700	Additional Requirements Needed	Jr	\N	[]
55	Cafe Beans Shop	Single Proprietorship	Retailing	\N	5 Colonel Bonny Serrano Ave.	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	1769430796_localhost_8080_Banwa_client_pages_resident_services.php.png	Pre-Approved	Application is complete. Proceed to payment.	\N	2026-01-26	2026-01-26 20:33:16.348469	2026-01-26 20:33:16.348469	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61650000	121.07569000	Pre-Approved	Jr	\N	[]
56	Test 1101	Single Proprietorship	Manufacturing	\N	21 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	server/api/resident/uploads/payment_proofs/proof_6977ada11b391.jpg	Approved	Application is complete.	\N	2026-01-27	2026-01-27 02:02:47.221676	2026-01-27 02:02:47.221676	Pending Verification	1000.00	1000.00	\N	2026-01-27 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61744400	121.07472100	Pre-Approved	Jr	\N	[]
57	JED's Shop	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	\N	Pre-Approved	Application is complete.	\N	2026-01-28	2026-01-28 15:54:09.430833	2026-01-28 15:54:09.430833	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	[]
58	Gun's Shop	Single Proprietorship	Services	\N	2 Comets Loop	["Owned"]	09237452347	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	\N	Approved	Application is complete	\N	2026-01-28	2026-01-28 17:31:36.085007	2026-01-28 17:31:36.085007	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61673600	121.07405400	Pre-Approved	Jr	\N	[]
59	Vention	Single Proprietorship	Retailing	\N	3 Twin Peaks Dr	["Owned"]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Jeferson	Putorez	Oliven	09123412341	3 Twin Peaks Dr	Residence	\N	6	["SEC","DTI"]	1770024128_Narrative Report Template.pdf	Pending	\N	\N	2026-02-02	2026-02-02 17:22:08.547734	2026-02-02 17:22:08.547734	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61682700	121.07468200	Pre-Approved	Jr	\N	[]
60	none	Single Proprietorship	Wholesale/Repacking	\N	14 Starline Rd	["Owned"]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Jeferson	Putorez	Oliven	09123412341	3 Union Lane	Store	\N	6	["SEC"]	["1770192689_Emotional_Poetry_Collection_3.pdf"]	Pending	\N	\N	2026-02-04	2026-02-04 16:11:30.244991	2026-02-04 16:11:30.244991	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61875900	121.07691500	Pre-Approved	Jr	\N	["1770192689_Emotional_Poetry_Collection_3.pdf"]
63	testing ka	Single Proprietorship	Manufacturing	\N	14 Twin Peaks Dr	["Owned"]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Jeferson	Putorez	Oliven	09123412341	3 Twin Peaks Dr	Office	\N	1	["Lease Contract"]	["1770197471_olyid.jpg"]	Complied	Missing valid Government ID or DTI Certificate. Please re-upload.	\N	2026-02-04	2026-02-04 17:14:01.456342	2026-02-04 17:31:12.242655	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61868300	121.07546400	Pre-Approved	Jr	\N	["1770197471_olyid.jpg"]
62	mehhhh	Single Proprietorship	Retailing	\N	3 Twin Peaks Dr	["Owned"]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Jeferson	Putorez	Oliven	09123412341	3 Union Lane	Office	\N	6	["SEC"]	["1770194505_Emotional_Poetry_Collection_3.pdf"]	Pending	\N	\N	2026-02-04	2026-02-04 16:41:45.996974	2026-02-04 16:41:45.996974	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61682700	121.07468200	Pre-Approved	Jr	\N	["1770194505_Emotional_Poetry_Collection_3.pdf"]
61	nyahhh	Partnership	Manufacturing	\N	3 Union Lane	["Rent-Free"]	09474277177	mateo.ronnelvictor.bronio@gmail.com	Jeferson	Putorez	Oliven	09123412341	3 Union Lane	Store	\N	6	["SEC"]	["1770194417_Emotional_Poetry_Collection_3.pdf"]	Pending	\N	\N	2026-02-04	2026-02-04 16:40:17.59642	2026-02-04 16:40:17.59642	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61797100	121.07385400	Additional Requirements Needed	Jr	\N	["1770194417_Emotional_Poetry_Collection_3.pdf"]
64	Sapatosan ni YD	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	1770205764_valid_id_test.jpg	Pending	\N	\N	2026-02-04	2026-02-04 19:49:24.870677	2026-02-04 19:49:24.870677	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	[]
69	Liquior Store	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	["1770224419_valid_id_test.jpg"]	Pending	\N	\N	2026-02-05	2026-02-05 01:00:19.284635	2026-02-05 01:00:19.284635	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1770224419_valid_id_test.jpg"]
67	asdf	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	34242342343	adf@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Office	\N	23	["Previous Business Permit"]	["1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"]	Pending	\N	\N	2026-02-04	2026-02-04 21:11:30.368267	2026-02-04 21:11:30.368267	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"]
65	Sapatusan ni Lance	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	["1770206637_valid_id_test.jpg"]	Pending	\N	\N	2026-02-04	2026-02-04 20:03:57.518449	2026-02-04 20:03:57.518449	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1770206637_valid_id_test.jpg"]
66	Salaminan ni Lance	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	5 Comets Loop	Store	\N	2	["SEC","DTI","TCT"]	["1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"]	Pending	\N	\N	2026-02-04	2026-02-04 20:18:00.681514	2026-02-04 20:18:00.681514	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"]
68	Salaminan ni Lance	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	5 Comets Loop	Store	\N	2	["SEC","DTI","TCT"]	["1770212617_valid_id_test.jpg"]	Pending	\N	\N	2026-02-04	2026-02-04 21:43:37.097432	2026-02-04 21:43:37.097432	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1770212617_valid_id_test.jpg"]
70	asdf	Single Proprietorship	Manufacturing	\N	23 Twin Peaks Dr	["Rent-Free"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	23	["Previous Business Permit"]	["1770239514_valid_id_test.jpg"]	Complied	Missing valid Government ID or DTI Certificate. Please re-upload.	\N	2026-02-05	2026-02-05 01:01:37.704045	2026-02-05 05:11:56.952524	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["1770239514_valid_id_test.jpg"]
71	Salamin Salamin ni Lance	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	23	["Previous Business Permit"]	["1770272683_valid_id_test.jpg"]	Complied	Missing valid Government ID or DTI Certificate. Please re-upload.	\N	2026-02-05	2026-02-05 02:14:38.355959	2026-02-05 14:24:46.982557	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1770272683_valid_id_test.jpg"]
73	Kapehan Store	Partnership	Retailing	\N	5 Comets Loop	["Rent-Free"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	4	["Previous Business Permit"]	["1770389466_Barangay-Blue-Ridge-B-Business-Clearance.pdf"]	Complied	Missing valid Government ID or DTI Certificate. Please re-upload.	\N	2026-02-06	2026-02-06 22:46:42.013783	2026-02-06 22:51:09.716199	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Additional Requirements Needed	Jr	\N	["1770389466_Barangay-Blue-Ridge-B-Business-Clearance.pdf"]
74	Flower Store	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	3	["DTI"]	["1771940375_localhost_8080_Banwa_client_pages_auth_suspended.php.png"]	Pending	\N	\N	2026-02-24	2026-02-24 21:39:35.033562	2026-02-24 21:39:35.033562	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1771940375_localhost_8080_Banwa_client_pages_auth_suspended.php.png"]
75	Flower Store	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	3	[]	["1771944309_localhost_8080_Banwa_client_pages_auth_suspended.php.png"]	Pending	\N	\N	2026-02-24	2026-02-24 22:45:09.20588	2026-02-24 22:45:09.20588	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1771944309_localhost_8080_Banwa_client_pages_auth_suspended.php.png"]
76	Flower Store	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	3	["SEC","DTI"]	["1771944339_localhost_8080_Banwa_client_pages_auth_suspended.php.png"]	Pre-Approved	Application is complete. Proceed to payment.	\N	2026-02-24	2026-02-24 22:45:39.812861	2026-02-24 22:45:39.812861	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1771944339_localhost_8080_Banwa_client_pages_auth_suspended.php.png"]
79	asdf	Single Proprietorship	Manufacturing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Store	\N	3	["Previous Business Permit"]	["biz_69a4208342bbe9.27188619.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 19:18:27.286179	2026-03-01 19:18:27.286179	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["biz_69a4208342bbe9.27188619.pdf"]
77	Flower Store	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Residence	\N	3	["SEC","DTI"]	["1771944628_Barangay-Blue-Ridge-B-Business-Clearance.pdf"]	Approved	Application is complete. Proceed to payment.	\N	2026-02-24	2026-02-24 22:50:28.628531	2026-02-24 22:50:28.628531	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["1771944628_Barangay-Blue-Ridge-B-Business-Clearance.pdf"]
80	Salamin Salamin ni Lance	Single Proprietorship	Manufacturing	\N	5 Twin Peaks Dr	["Rent-Free"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	30 BLK 2 Pook Palaris U.P Diliman	Office	\N	3	["Previous Business Permit"]	["biz_69a4224c2ecc10.78655682.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 19:26:04.207172	2026-03-01 19:26:04.207172	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714100	121.07482500	Pre-Approved	Jr	\N	["biz_69a4224c2ecc10.78655682.pdf"]
84	Salamin Salamin ni Lance 222	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	34242342343	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	30 BLK 2 Pook Palaris U.P Diliman	Warehouse	\N	23	["SEC"]	["biz_69a429528c4000.45881504.png"]	Pending	\N	\N	2026-03-01	2026-03-01 19:56:02.59925	2026-03-01 19:56:02.59925	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Additional Requirements Needed	Jr	\N	["biz_69a429528c4000.45881504.png"]
78	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	asdf	15 Comets Loop	["Others"]	09237452347	muring.jeferson.ismael@gmail.com	ken	\N	Estabilo	09123412341	15 Comets Loop	Residence	asdfasdf	3	["[\\"SEC\\",\\"DTI\\"]"]	["biz_69a3fd20d837f2.24689459.png"]	Pre-Approved	Application is complete. Proceed to payment.	\N	2026-03-01	2026-03-01 16:47:28.928904	2026-03-01 16:47:28.928904	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	Rejected		Renew	["biz_69a3fd20d837f2.24689459.png"]
81	Test 1101	Single Proprietorship	Services	\N	24 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	30 BLK 2 Pook Palaris U.P Diliman	Residence	\N	23	["Previous Business Permit"]	["biz_69a42303600162.03058848.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 19:29:07.406084	2026-03-01 19:29:07.406084	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61817100	121.07499500	Pre-Approved	Jr	\N	["biz_69a42303600162.03058848.pdf"]
82	Test 1101	Single Proprietorship	Services	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	30 BLK 2 Pook Palaris U.P Diliman	Warehouse	\N	23	["Previous Business Permit"]	["biz_69a42504157903.75238390.png"]	Pending	\N	\N	2026-03-01	2026-03-01 19:37:40.094226	2026-03-01 19:37:40.094226	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["biz_69a42504157903.75238390.png"]
83	Salamin Salamin ni Lance	Partnership	Manufacturing	\N	5 Twin Peaks Dr	["Rent-Free"]	34242342343	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	30 BLK 2 Pook Palaris U.P Diliman	Office	\N	35	["SEC"]	["biz_69a426fb80eba1.54907259.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 19:46:03.534396	2026-03-01 19:46:03.534396	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714100	121.07482500	Additional Requirements Needed	Jr	\N	["biz_69a426fb80eba1.54907259.pdf"]
85	Salamin Salamin ni Lance	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	30 BLK 2 Pook Palaris U.P Diliman	Residence	\N	23	["Previous Business Permit"]	["biz_69a429e837cf51.02647301.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 19:58:32.233558	2026-03-01 19:58:32.233558	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["biz_69a429e837cf51.02647301.pdf"]
87	asdf	Single Proprietorship	Retailing	\N	23 Twin Peaks Dr	["Owned"]	34242342343	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Twin Peaks Dr	Office	\N	35	["Previous Business Permit"]	["biz_69a42b20d20504.63482783.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 20:03:44.874226	2026-03-01 20:03:44.874226	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["biz_69a42b20d20504.63482783.pdf"]
86	Salamin Salamin ni Lance 222	Single Proprietorship	Services	\N	21 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	30 BLK 2 Pook Palaris U.P Diliman	Store	\N	35	["Previous Business Permit"]	["biz_69a42a56748b28.47735258.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 20:00:22.483771	2026-03-01 20:00:22.483771	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61744400	121.07472100	Pre-Approved	Jr	\N	["biz_69a42a56748b28.47735258.pdf"]
88	Salamin Salamin ni Lance	Partnership	Rentals	\N	2 Evening Glow Rd	["Rent-Free"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Office	\N	35	["Previous Business Permit"]	["biz_69a42c646008f9.26455309.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 20:09:08.410873	2026-03-01 20:09:08.410873	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61807000	121.07617100	Additional Requirements Needed	Jr	\N	["biz_69a42c646008f9.26455309.pdf"]
89	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	\N	15 Comets Loop	["Owned"]	34242342343	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Residence	\N	23	["DTI"]	["biz_69a438d046b1c4.88310628.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 21:02:08.318963	2026-03-01 21:02:08.318963	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61661500	121.07361200	Additional Requirements Needed	Jr	\N	["biz_69a438d046b1c4.88310628.pdf"]
90	Salamin Salamin ni Lance 222	Single Proprietorship	Services	\N	23 Twin Peaks Dr	["Leased"]	34242342343	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Office	\N	23	["Previous Business Permit"]	["biz_69a43a3a520427.22705037.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 21:08:10.348297	2026-03-01 21:08:10.348297	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["biz_69a43a3a520427.22705037.pdf"]
91	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	\N	15 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	23 Twin Peaks Dr	Residence	\N	23	["Previous Business Permit"]	["biz_69a43c664a8734.02930583.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 21:17:26.322418	2026-03-01 21:17:26.322418	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61661500	121.07361200	Pre-Approved	Jr	\N	["biz_69a43c664a8734.02930583.pdf"]
92	asdf	Single Proprietorship	Manufacturing	\N	24 Twin Peaks Dr	["Owned"]	34242342343	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	1 Comets Loop	Office	\N	23	["SEC"]	["biz_69a43c9bf19584.52207731.pdf"]	Pending	\N	\N	2026-03-01	2026-03-01 21:18:19.99327	2026-03-01 21:18:19.99327	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61817100	121.07499500	Additional Requirements Needed	Jr	\N	["biz_69a43c9bf19584.52207731.pdf"]
30	Denki Shop	Corporation	Retailing	\N	3 Milkyway Dr	["Rent-Free"]	09789623653	lance@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	3	["Previous Business Permit"]	server/api/resident/uploads/payment_proofs/proof_69a592e4b10c9.jpg	Payment Submitted	\N	\N	2026-01-24	2026-01-24 17:59:01.300036	2026-01-24 17:59:01.300036	Pending Verification	0.00	1000.00	\N	2026-03-12 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61678100	121.07514400	\N	Jr	\N	[]
94	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	\N	15 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Store	\N	23	["Previous Business Permit"]	["biz_69a442ba11d956.86102641.pdf"]	Pre-Approved	Application is complete. Proceed to payment.	\N	2026-03-01	2026-03-01 21:44:26.104152	2026-03-01 21:44:26.104152	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61882400	121.07552000	Pre-Approved	Jr	\N	["biz_69a442ba11d956.86102641.pdf"]
93	Salamin Salamin ni Lance 222	Single Proprietorship	Retailing	\N	5 Comets Loop	["Owned"]	34242342343	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341	15 Comets Loop	Office	\N	3	["Previous Business Permit"]	["biz_69a43d89347470.77184016.pdf"]	Pre-Approved	Application is complete. Proceed to payment.	\N	2026-03-01	2026-03-01 21:22:17.231165	2026-03-01 21:22:17.231165	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714000	121.07408800	Pre-Approved	Jr	\N	["biz_69a43d89347470.77184016.pdf"]
103	Salamin Salamin ni Lance 222	Corporation	Manufacturing	N/A	21 Twin Peaks Dr	["Others"]	09237452347	muring.jeferson.ismael@gmail.com	Ten	\N	Safari	09123412341	23 Comets Loop	Store	N/A	3	["TCT"]	["biz_69a7f4963f24d3.66485073.png","biz_69a7f4963fd752.51183231.png"]	Pending	\N	\N	2026-03-04	2026-03-04 17:00:06.276654	2026-03-04 17:00:06.276654	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	Rejected		New	["biz_69a7f4963f24d3.66485073.png", "biz_69a7f4963fd752.51183231.png"]
96	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	asdf	5 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Ismael	Muring	63456456656	15 Comets Loop	Residence	asdfasdf	23	["SEC","DTI"]	server/api/resident/uploads/payment_proofs/proof_69a59ed88c06b.png	Pre-Approved	Application is complete. Proceed to payment.	Your application was disapproved due to: failed to meet the requirements. You may re-apply once requirements are met.	2026-03-02	2026-03-02 22:00:40.96746	2026-03-02 22:00:40.96746	Pending Verification	350.00	350.00	\N	2026-03-02 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	Rejected	jr	Renew	["biz_69a59808e694f9.84067787.jpg", "biz_69a59808e7dd45.15664057.pdf", "biz_69a59808e852e5.40939999.jpg", "biz_69a59808e92967.54253452.pdf"]
97	asdf	Single Proprietorship	Manufacturing	\N	23 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Office	\N	23	["Previous Business Permit"]	["biz_69a7c031840853.80737608.png"]	Pending	\N	\N	2026-03-04	2026-03-04 13:16:33.549252	2026-03-04 13:16:33.549252	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["biz_69a7c031840853.80737608.png"]
100	asdf	Single Proprietorship	Manufacturing	\N	23 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Office	\N	23	["Previous Business Permit"]	["biz_69a7c32e5a6db9.64220571.png"]	Pending	\N	\N	2026-03-04	2026-03-04 13:29:18.374929	2026-03-04 13:29:18.374929	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["biz_69a7c32e5a6db9.64220571.png"]
98	asdf	Single Proprietorship	Manufacturing	\N	23 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Office	\N	23	["Previous Business Permit"]	["biz_69a7c152957f77.80596756.png"]	Pending	\N	\N	2026-03-04	2026-03-04 13:21:22.619394	2026-03-04 13:21:22.619394	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["biz_69a7c152957f77.80596756.png"]
99	asdf	Single Proprietorship	Manufacturing	\N	23 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Office	\N	23	["Previous Business Permit"]	["biz_69a7c1ec1e2dc8.09941198.png"]	Pending	\N	\N	2026-03-04	2026-03-04 13:23:56.147273	2026-03-04 13:23:56.147273	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["biz_69a7c1ec1e2dc8.09941198.png"]
101	asdf	Single Proprietorship	Manufacturing	\N	23 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Office	\N	23	["Previous Business Permit"]	["biz_69a7c3484cd889.62898576.png"]	Pending	\N	\N	2026-03-04	2026-03-04 13:29:44.318788	2026-03-04 13:29:44.318788	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61800400	121.07496800	Pre-Approved	Jr	\N	["biz_69a7c3484cd889.62898576.png"]
102	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	\N	24 Twin Peaks Dr	["Leased"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Factory	\N	23	["DTI"]	["biz_69a7d86b48bb02.70676189.png"]	Pre-Approved	Application is complete.	\N	2026-03-04	2026-03-04 14:59:55.308059	2026-03-04 14:59:55.308059	Unpaid	0.00	0.00	\N	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61817100	121.07499500	Pre-Approved	Jr	\N	["biz_69a7d86b48bb02.70676189.png"]
104	Salamin Salamin ni Lance 222	Single Proprietorship	Manufacturing	N/A	23 Twin Peaks Dr	["Leased"]	09237452347	muring.jeferson.ismael@gmail.com	Lee	\N	Elibidad	09123412341	15 Comets Loop	Residence	N/A	23	["SEC"]	["biz_69a806a48bcf36.03633534.png","biz_69a806a48caa98.16824764.png"]	Pending	\N	\N	2026-03-04	2026-03-04 18:17:08.587216	2026-03-04 18:17:08.587216	Unpaid	0.00	0.00	\N	\N	\N	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	\N	\N	Rejected		Renew	["biz_69a806a48bcf36.03633534.png", "biz_69a806a48caa98.16824764.png"]
105	Jasmine's Shoe Glue Shop	Single Proprietorship	Retailing	\N	5 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Store	\N	3	["SEC"]	server/api/resident/uploads/payment_proofs/proof_69a82773cd424.png	Paid	Your application is approved. Please pay the assessment amount of ₱350 via the portal or at the Treasury office.	\N	2026-03-04	2026-03-04 20:29:22.342058	2026-03-04 20:37:48.161303	Paid	350.00	350.00	\N	2026-03-04 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61714100	121.07482500	Pre-Approved	Jr	\N	["biz_69a825a2510370.96835685.pdf"]
106	TOTE Store	Single Proprietorship	Others	Retailing	5 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Ismael	Muring	09132456778		Others	Tindahan	3	["DTI","TCT"]	server/api/resident/uploads/payment_proofs/proof_69a880c6a80ac.jpg	Approved	Your Business Permit is now ready for pick-up/download.	\N	2026-03-05	2026-03-05 02:53:24.9657	2026-03-05 02:59:43.118062	Paid	350.00	350.00	\N	2026-03-13 00:00:00	GCash/QR	d1b6349d-f242-458e-b576-42fb8bbe0f5d	14.61714000	121.07408800	Pre-Approved		\N	["1772650586_valid_id_3.jpg"]
38	Gambling Den	Single Proprietorship	Others	Gambling Operations	22 Twin Peaks Dr	["Owned"]	09123456789	gambling@example.com	Jeferson	Putorez	Oliven	09123412341	8 Riverview Dr	Store	\N	5	["SEC","DTI","TCT","Lease Contract"]	server/api/resident/uploads/payment_proofs/proof_69a884039ba67.jpg	Payment Submitted	\N	\N	2026-01-24	2026-01-24 19:11:33.825393	2026-01-24 19:11:33.825393	Pending Verification	0.00	350.00	\N	2026-03-13 00:00:00	GCash/QR	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61783400	121.07488200	Additional Requirements Needed	Jr	\N	[]
95	Salamin Salamin ni Lance 222	Single Proprietorship	Retailing	\N	2 Comets Loop	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Putorez	Oliven	09123412341		Residence	\N	35	["Previous Business Permit"]	["biz_69a444b31796c2.67680915.pdf"]	Paid	Application is complete. Proceed to payment.	\N	2026-03-01	2026-03-01 21:52:51.110494	2026-03-05 10:20:46.922744	Paid	1000.00	1000.00	8898787623	2026-03-05 10:20:46.922744	Cash	db1d1ed3-3042-48ce-8b1e-b371402836f5	14.61673600	121.07405400	Pre-Approved	Jr	\N	["biz_69a444b31796c2.67680915.pdf"]
107	TOTE Store	Single Proprietorship	Retailing	\N	7 Twin Peaks Dr	["Owned"]	09237452347	muring.jeferson.ismael@gmail.com	Jeferson	Ismael	Muring	09919926620		Store	\N	3	["TCT"]	server/api/resident/uploads/payment_proofs/proof_69a908b456e2b.jpg	Approved	Your Business Clearance is now ready for pick-up/download.	\N	2026-03-05	2026-03-05 12:35:53.062272	2026-03-05 12:38:32.278674	Paid	350.00	350.00	\N	2026-03-13 00:00:00	GCash/QR	a44e109d-622d-437d-bb0c-e7e32daafe4a	14.61754800	121.07516700	Pre-Approved		\N	["biz_69a908290bd354.55501799.pdf"]
\.


--
-- TOC entry 6222 (class 0 OID 44151)
-- Dependencies: 231
-- Data for Name: business_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_evaluations (id, application_id, dss_status, evaluation_details, evaluated_at) FROM stdin;
11	23	Pending Evaluation	{}	2026-01-23 20:16:09.237325
1	16	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-23 17:43:04.410583
3	17	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner, Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-23 17:55:57.309305
5	18	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-23 18:03:55.955249
12	24	Pending Evaluation	{}	2026-01-23 21:48:27.38927
22	34	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner"], "approval_probability": 83.33}	2026-01-24 18:59:49.309539
13	25	Pending Evaluation	{}	2026-01-23 22:01:45.539979
8	20	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner, Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-23 18:18:26.591156
9	21	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner, Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-23 18:20:36.745119
10	22	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner, Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-23 18:22:28.113202
14	26	Pending Evaluation	{}	2026-01-23 22:03:19.792208
15	27	Pending Evaluation	{}	2026-01-23 22:42:47.49305
7	19	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-23 23:45:52.592366
16	28	Pending Evaluation	{}	2026-01-24 17:53:47.696873
17	29	Pending Evaluation	{}	2026-01-24 17:56:16.378668
18	30	Pending Evaluation	{}	2026-01-24 17:59:01.304293
19	31	Pending Evaluation	{}	2026-01-24 18:05:45.926592
20	32	Pending Evaluation	{}	2026-01-24 18:10:38.020056
21	33	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-24 18:32:33.616558
23	35	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "approval_probability": 66.67}	2026-01-24 19:02:57.964142
24	36	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner"], "approval_probability": 83.33}	2026-01-24 19:05:55.560278
25	37	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner"], "approval_probability": 83.33}	2026-01-24 19:08:27.803011
26	38	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Business Type Compliance Rule"], "passed_rules": ["Valid Business Location Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner", "Business type may be restricted in this area. Please contact the barangay office for clarification on permitted business types."], "approval_probability": 66.67}	2026-01-24 19:11:33.8337
27	39	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Photocopy of Valid ID of Business Owner"], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule. Please address the recommendations.", "approval_probability": 83.33, "failed_rules_details": {"R1": "Complete Requirements Rule"}}	2026-01-24 19:19:55.447104
28	40	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-01-24 19:22:20.625806
29	41	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-01-24 20:46:18.720501
30	42	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule. Please address the recommendations.", "approval_probability": 66.67, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule"}}	2026-01-24 21:11:22.083142
31	43	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Articles of Incorporation, Corporate Secretary Certificate", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule. Please address the recommendations.", "approval_probability": 66.67, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule"}}	2026-01-24 21:39:13.769043
32	44	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-01-25 22:42:28.685402
33	45	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule. Please address the recommendations.", "approval_probability": 66.67, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule"}}	2026-01-26 18:49:20.488377
35	47	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule. Please address the recommendations.", "approval_probability": 66.67, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule"}}	2026-01-26 19:05:03.756696
36	48	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Articles of Incorporation, Corporate Secretary Certificate", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule. Please address the recommendations.", "approval_probability": 66.67, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule"}}	2026-01-26 19:06:48.42287
37	49	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-01-26 19:07:41.879472
34	46	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule. Please address the recommendations.", "approval_probability": 66.67, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule"}}	2026-01-26 19:12:52.670861
38	50	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-01-26 19:16:11.334607
39	51	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement"], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule. Please address the recommendations.", "approval_probability": 83.33, "failed_rules_details": {"R1": "Complete Requirements Rule"}}	2026-01-26 19:43:34.171925
40	52	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement"], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule. Please address the recommendations.", "approval_probability": 83.33, "failed_rules_details": {"R1": "Complete Requirements Rule"}}	2026-01-26 19:46:30.314972
41	53	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement"], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule. Please address the recommendations.", "approval_probability": 83.33, "failed_rules_details": {"R1": "Complete Requirements Rule"}}	2026-01-26 19:56:09.529436
42	54	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-01-26 20:21:59.763732
43	55	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-01-26 20:33:16.38414
44	56	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-01-27 02:02:47.277618
45	57	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-01-28 15:54:09.477034
46	58	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-01-28 17:31:36.134089
47	59	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-02-02 17:22:08.592297
48	60	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-04 16:11:30.279577
49	61	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement"], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule. Please address the recommendations.", "approval_probability": 83.33, "failed_rules_details": {"R1": "Complete Requirements Rule"}}	2026-02-04 16:40:17.620071
50	62	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-04 16:41:46.012539
51	63	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-04 17:31:12.256425
56	64	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-04 19:49:24.901224
57	65	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-04 20:03:57.708146
58	66	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-04 20:18:00.867462
59	67	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-02-04 21:11:30.689662
62	68	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 6, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-04 21:43:37.194939
63	69	Pre-Approved	{"score": 7, "rule_id": "R7", "max_score": 7, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule", "School Zone Business Restriction"], "triggered_rule": "School Zone Business Restriction", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-05 01:00:19.624494
64	70	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-02-05 05:11:56.977333
66	71	Pre-Approved	{"score": 5, "rule_id": "R1", "max_score": 6, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 83.33, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-02-05 14:24:47.016189
67	73	Additional Requirements Needed	{"score": 5, "rule_id": "R2", "max_score": 6, "failed_rules": ["Complete Requirements Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement"], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule. Please address the recommendations.", "approval_probability": 83.33, "failed_rules_details": {"R1": "Complete Requirements Rule"}}	2026-02-06 22:51:09.724269
68	74	Pre-Approved	{"score": 7, "rule_id": "R7", "max_score": 7, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule", "Uploaded Requirements Match Selected Rule"], "triggered_rule": "Uploaded Requirements Match Selected Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-24 21:39:35.213578
69	75	Pre-Approved	{"score": 7, "rule_id": "R7", "max_score": 7, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule", "Uploaded Requirements Match Selected Rule"], "triggered_rule": "Uploaded Requirements Match Selected Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-24 22:45:09.42585
70	76	Pre-Approved	{"score": 7, "rule_id": "R7", "max_score": 7, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule", "Uploaded Requirements Match Selected Rule"], "triggered_rule": "Uploaded Requirements Match Selected Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-02-24 22:45:39.907561
71	77	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 7, "failed_rules": ["Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-02-24 22:50:28.749816
72	78	Rejected	{"score": 4, "rule_id": "R3", "max_score": 7, "failed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Business Type Compliance Rule", "failed_critical": ["R1", "R2"], "passed_critical": ["R3", "R4"], "recommendations": ["Please submit the following missing requirements: Previous Business Permit", "Business location appears to be outside Barangay Blue Ridge B boundaries. Please verify the address or consider relocating within barangay jurisdiction."], "rejection_reason": "Failed critical rules: R1, R2", "status_explanation": "Application failed critical rules: R1, R2. Cannot proceed with current information.", "approval_probability": 57.14, "failed_rules_details": {"R1": "Complete Requirements Rule", "R2": "Valid Business Location Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-01 16:47:29.062123
73	79	Pre-Approved	{"score": 7, "rule_id": "R7", "max_score": 7, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-03-01 19:18:28.442266
76	80	Pre-Approved	{"score": 7, "rule_id": "R7", "max_score": 7, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-03-01 19:26:05.213064
79	81	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 19:29:08.451619
82	82	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 19:37:41.098914
85	83	Additional Requirements Needed	{"score": 4, "rule_id": "R2", "max_score": 7, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Business Location Rule", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule, Uploaded Requirements Must Exactly Match Selected Requirements. Please address the recommendations.", "approval_probability": 57.14, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-01 19:46:04.528055
88	84	Additional Requirements Needed	{"score": 5, "rule_id": "R1", "max_score": 7, "failed_rules": ["Employee Capacity Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Employee Capacity Rule, Uploaded Requirements Must Exactly Match Selected Requirements. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"R5": "Employee Capacity Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-01 19:56:03.693742
91	85	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 19:58:33.178674
94	86	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 20:00:23.434271
97	87	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 20:03:45.878205
100	88	Additional Requirements Needed	{"score": 5, "rule_id": "R7", "max_score": 7, "failed_rules": ["Complete Requirements Rule", "Employee Capacity Rule"], "passed_rules": ["Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": ["R1"], "passed_critical": ["R2", "R3", "R4"], "recommendations": ["Please submit the following missing requirements: Partnership Agreement", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Complete Requirements Rule, Employee Capacity Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"R1": "Complete Requirements Rule", "R5": "Employee Capacity Rule"}}	2026-03-01 20:09:09.386402
103	89	Additional Requirements Needed	{"score": 5, "rule_id": "R1", "max_score": 7, "failed_rules": ["Employee Capacity Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Employee Capacity Rule, Uploaded Requirements Must Exactly Match Selected Requirements. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"R5": "Employee Capacity Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-01 21:02:09.404209
106	90	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 21:08:11.479744
109	91	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 21:17:27.429464
112	92	Additional Requirements Needed	{"score": 5, "rule_id": "R1", "max_score": 7, "failed_rules": ["Employee Capacity Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Some requirements need attention. Failed rules: Employee Capacity Rule, Uploaded Requirements Must Exactly Match Selected Requirements. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"R5": "Employee Capacity Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-01 21:18:21.005628
115	93	Pre-Approved	{"score": 7, "rule_id": "R7", "max_score": 7, "failed_rules": [], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-03-01 21:22:18.296822
116	94	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 21:44:27.162302
117	95	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-01 21:52:52.147808
118	96	Rejected	{"score": 3, "rule_id": "R3", "max_score": 7, "failed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Employee Capacity Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Business Type Compliance Rule", "failed_critical": ["R1", "R2"], "passed_critical": ["R3", "R4"], "recommendations": ["Please submit the following missing requirements: Previous Business Permit", "Business location appears to be outside Barangay Blue Ridge B boundaries. Please verify the address or consider relocating within barangay jurisdiction.", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "rejection_reason": "Failed critical rules: R1, R2", "status_explanation": "Application failed critical rules: R1, R2. Cannot proceed with current information.", "approval_probability": 42.86, "failed_rules_details": {"R1": "Complete Requirements Rule", "R2": "Valid Business Location Rule", "R5": "Employee Capacity Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-02 22:00:45.21175
119	97	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-04 13:16:34.575611
120	98	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-04 13:21:23.612827
121	99	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-04 13:23:57.101602
122	100	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-04 13:29:19.350101
123	101	Pre-Approved	{"score": 6, "rule_id": "R7", "max_score": 7, "failed_rules": ["Employee Capacity Rule"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "triggered_rule": "Uploaded Requirements Must Exactly Match Selected Requirements", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": ["Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R5": "Employee Capacity Rule"}}	2026-03-04 13:29:45.262097
124	102	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 7, "failed_rules": ["Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-04 14:59:56.247064
125	103	Rejected	{"score": 4, "rule_id": "R3", "max_score": 7, "failed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Business Type Compliance Rule", "failed_critical": ["R1", "R2"], "passed_critical": ["R3", "R4"], "recommendations": ["Please submit the following missing requirements: SEC, DTI, Lease Contract, Articles of Incorporation, Corporate Secretary Certificate", "Business location appears to be outside Barangay Blue Ridge B boundaries. Please verify the address or consider relocating within barangay jurisdiction."], "rejection_reason": "Failed critical rules: R1, R2", "status_explanation": "Application failed critical rules: R1, R2. Cannot proceed with current information.", "approval_probability": 57.14, "failed_rules_details": {"R1": "Complete Requirements Rule", "R2": "Valid Business Location Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-04 17:00:09.721748
126	104	Rejected	{"score": 3, "rule_id": "R3", "max_score": 7, "failed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Employee Capacity Rule", "Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Business Type Compliance Rule", "Structure Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Business Type Compliance Rule", "failed_critical": ["R1", "R2"], "passed_critical": ["R3", "R4"], "recommendations": ["Please submit the following missing requirements: Previous Business Permit", "Business location appears to be outside Barangay Blue Ridge B boundaries. Please verify the address or consider relocating within barangay jurisdiction.", "Number of employees exceeds the recommended capacity for this structure type. Consider reducing staff or upgrading to a larger facility."], "rejection_reason": "Failed critical rules: R1, R2", "status_explanation": "Application failed critical rules: R1, R2. Cannot proceed with current information.", "approval_probability": 42.86, "failed_rules_details": {"R1": "Complete Requirements Rule", "R2": "Valid Business Location Rule", "R5": "Employee Capacity Rule", "R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-04 18:17:10.613133
127	105	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 7, "failed_rules": ["Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-04 20:29:23.338645
128	106	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 7, "failed_rules": ["Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-05 02:56:31.20626
129	107	Pre-Approved	{"score": 6, "rule_id": "R1", "max_score": 7, "failed_rules": ["Uploaded Requirements Must Exactly Match Selected Requirements"], "passed_rules": ["Complete Requirements Rule", "Valid Business Location Rule", "Business Type Compliance Rule", "Structure Safety Rule", "Employee Capacity Rule", "Valid Contact Information Rule"], "triggered_rule": "Complete Requirements Rule", "failed_critical": [], "passed_critical": ["R1", "R2", "R3", "R4"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"R7": "Uploaded Requirements Must Exactly Match Selected Requirements"}}	2026-03-05 12:35:54.123381
\.


--
-- TOC entry 6224 (class 0 OID 44162)
-- Dependencies: 233
-- Data for Name: business_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_files (id, application_id, filename, saved_filename, file_url, checksum, size_bytes, mime_type, created_at) FROM stdin;
1	60	1770192689_Emotional_Poetry_Collection_3.pdf	1770192689_Emotional_Poetry_Collection_3.pdf	/server/handlers/staff/business/uploads/1770192689_Emotional_Poetry_Collection_3.pdf	\N	\N	\N	2026-02-04 16:11:30.256164+08
2	61	1770194417_Emotional_Poetry_Collection_3.pdf	1770194417_Emotional_Poetry_Collection_3.pdf	/server/handlers/staff/business/uploads/1770194417_Emotional_Poetry_Collection_3.pdf	\N	\N	\N	2026-02-04 16:40:20.138594+08
3	62	1770194505_Emotional_Poetry_Collection_3.pdf	1770194505_Emotional_Poetry_Collection_3.pdf	/server/handlers/staff/business/uploads/1770194505_Emotional_Poetry_Collection_3.pdf	\N	\N	\N	2026-02-04 16:41:47.98291+08
4	63	1770196441_olyid.jpg	1770196441_olyid.jpg	/server/handlers/staff/business/uploads/1770196441_olyid.jpg	\N	\N	\N	2026-02-04 17:16:09.427801+08
5	65	1770206637_valid_id_test.jpg	1770206637_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770206637_valid_id_test.jpg	\N	\N	\N	2026-02-04 20:08:00.734384+08
6	66	1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	\N	\N	\N	2026-02-04 21:41:48.680685+08
7	67	1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	\N	\N	\N	2026-02-04 21:41:53.113961+08
8	68	1770212617_valid_id_test.jpg	1770212617_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770212617_valid_id_test.jpg	\N	\N	\N	2026-02-04 21:43:41.265976+08
9	69	1770224419_valid_id_test.jpg	1770224419_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770224419_valid_id_test.jpg	\N	\N	\N	2026-02-05 01:00:23.584907+08
10	70	1770224497_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770224497_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770224497_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	\N	\N	\N	2026-02-05 01:01:42.781948+08
11	71	1770228878_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770228878_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770228878_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	\N	\N	\N	2026-02-05 02:14:44.866827+08
13	78	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	biz_69a3fd20d837f2.24689459.png	/server/handlers/staff/business/uploads/biz_69a3fd20d837f2.24689459.png	94c4b582cb39f3657103dd47fce0902c	352638	image/png	2026-03-01 16:47:28.983076+08
14	79	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a4208342bbe9.27188619.pdf	/server/handlers/staff/business/uploads/biz_69a4208342bbe9.27188619.pdf	8ab4acea8c4305d66917076c3940a444	107679	application/pdf	2026-03-01 19:18:27.310958+08
15	80	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a4224c2ecc10.78655682.pdf	/server/handlers/staff/business/uploads/biz_69a4224c2ecc10.78655682.pdf	8ab4acea8c4305d66917076c3940a444	107679	application/pdf	2026-03-01 19:26:04.238291+08
16	81	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a42303600162.03058848.pdf	/server/handlers/staff/business/uploads/biz_69a42303600162.03058848.pdf	8ab4acea8c4305d66917076c3940a444	107679	application/pdf	2026-03-01 19:29:07.423695+08
17	82	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	biz_69a42504157903.75238390.png	/server/handlers/staff/business/uploads/biz_69a42504157903.75238390.png	94c4b582cb39f3657103dd47fce0902c	352638	image/png	2026-03-01 19:37:40.10831+08
18	83	users_export (32).pdf	biz_69a426fb80eba1.54907259.pdf	/server/handlers/staff/business/uploads/biz_69a426fb80eba1.54907259.pdf	be1f114f4c1819972e754f2f03972b4f	287061	application/pdf	2026-03-01 19:46:03.551181+08
19	84	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	biz_69a429528c4000.45881504.png	/server/handlers/staff/business/uploads/biz_69a429528c4000.45881504.png	94c4b582cb39f3657103dd47fce0902c	352638	image/png	2026-03-01 19:56:02.616183+08
20	85	applicationsTable_export (3).pdf	biz_69a429e837cf51.02647301.pdf	/server/handlers/staff/business/uploads/biz_69a429e837cf51.02647301.pdf	9dbce31ff1cb5a64180e442192b72200	46858	application/pdf	2026-03-01 19:58:32.23921+08
21	86	users_export (33).pdf	biz_69a42a56748b28.47735258.pdf	/server/handlers/staff/business/uploads/biz_69a42a56748b28.47735258.pdf	82ac8c536a7d6e34525b554b8008611c	13367	application/pdf	2026-03-01 20:00:22.489021+08
22	87	applicationsTable_export (3).pdf	biz_69a42b20d20504.63482783.pdf	/server/handlers/staff/business/uploads/biz_69a42b20d20504.63482783.pdf	9dbce31ff1cb5a64180e442192b72200	46858	application/pdf	2026-03-01 20:03:44.897204+08
23	88	applicationsTable_export (3).pdf	biz_69a42c646008f9.26455309.pdf	/server/handlers/staff/business/uploads/biz_69a42c646008f9.26455309.pdf	9dbce31ff1cb5a64180e442192b72200	46858	application/pdf	2026-03-01 20:09:08.430953+08
24	89	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a438d046b1c4.88310628.pdf	/server/handlers/staff/business/uploads/biz_69a438d046b1c4.88310628.pdf	8ab4acea8c4305d66917076c3940a444	107679	application/pdf	2026-03-01 21:02:08.346502+08
25	90	applicationsTable_export (1).pdf	biz_69a43a3a520427.22705037.pdf	/server/handlers/staff/business/uploads/biz_69a43a3a520427.22705037.pdf	c247293663142d9faf17c2ee9590071b	77713	application/pdf	2026-03-01 21:08:10.368042+08
26	91	users_export (33).pdf	biz_69a43c664a8734.02930583.pdf	/server/handlers/staff/business/uploads/biz_69a43c664a8734.02930583.pdf	82ac8c536a7d6e34525b554b8008611c	13367	application/pdf	2026-03-01 21:17:26.341854+08
27	92	users_export (33).pdf	biz_69a43c9bf19584.52207731.pdf	/server/handlers/staff/business/uploads/biz_69a43c9bf19584.52207731.pdf	82ac8c536a7d6e34525b554b8008611c	13367	application/pdf	2026-03-01 21:18:19.998031+08
28	93	users_export (33).pdf	biz_69a43d89347470.77184016.pdf	/server/handlers/staff/business/uploads/biz_69a43d89347470.77184016.pdf	82ac8c536a7d6e34525b554b8008611c	13367	application/pdf	2026-03-01 21:22:17.251593+08
29	94	applicationsTable_export (3).pdf	biz_69a442ba11d956.86102641.pdf	/server/handlers/staff/business/uploads/biz_69a442ba11d956.86102641.pdf	9dbce31ff1cb5a64180e442192b72200	46858	application/pdf	2026-03-01 21:44:26.153963+08
30	95	applicationsTable_export (3).pdf	biz_69a444b31796c2.67680915.pdf	/server/handlers/staff/business/uploads/biz_69a444b31796c2.67680915.pdf	9dbce31ff1cb5a64180e442192b72200	46858	application/pdf	2026-03-01 21:52:51.130575+08
31	96	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	biz_69a59808e694f9.84067787.jpg	/server/handlers/staff/business/uploads/biz_69a59808e694f9.84067787.jpg	ba68f54a2eeccfe9b58283f38b63ec11	83151	image/jpeg	2026-03-02 22:00:41.013009+08
32	96	users_export (33).pdf	biz_69a59808e7dd45.15664057.pdf	/server/handlers/staff/business/uploads/biz_69a59808e7dd45.15664057.pdf	82ac8c536a7d6e34525b554b8008611c	13367	application/pdf	2026-03-02 22:00:41.039627+08
33	96	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	biz_69a59808e852e5.40939999.jpg	/server/handlers/staff/business/uploads/biz_69a59808e852e5.40939999.jpg	ba68f54a2eeccfe9b58283f38b63ec11	83151	image/jpeg	2026-03-02 22:00:41.048923+08
34	96	users_export (33).pdf	biz_69a59808e92967.54253452.pdf	/server/handlers/staff/business/uploads/biz_69a59808e92967.54253452.pdf	82ac8c536a7d6e34525b554b8008611c	13367	application/pdf	2026-03-02 22:00:41.054896+08
35	97	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c031840853.80737608.png	/server/handlers/staff/business/uploads/biz_69a7c031840853.80737608.png	b7b669125f77eb5886d989f2e87286e0	108815	image/png	2026-03-04 13:16:33.59968+08
36	98	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c152957f77.80596756.png	/server/handlers/staff/business/uploads/biz_69a7c152957f77.80596756.png	b7b669125f77eb5886d989f2e87286e0	108815	image/png	2026-03-04 13:21:22.6341+08
37	99	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c1ec1e2dc8.09941198.png	/server/handlers/staff/business/uploads/biz_69a7c1ec1e2dc8.09941198.png	b7b669125f77eb5886d989f2e87286e0	108815	image/png	2026-03-04 13:23:56.154908+08
38	100	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c32e5a6db9.64220571.png	/server/handlers/staff/business/uploads/biz_69a7c32e5a6db9.64220571.png	b7b669125f77eb5886d989f2e87286e0	108815	image/png	2026-03-04 13:29:18.381523+08
39	101	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c3484cd889.62898576.png	/server/handlers/staff/business/uploads/biz_69a7c3484cd889.62898576.png	b7b669125f77eb5886d989f2e87286e0	108815	image/png	2026-03-04 13:29:44.32358+08
40	102	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7d86b48bb02.70676189.png	/server/handlers/staff/business/uploads/biz_69a7d86b48bb02.70676189.png	b7b669125f77eb5886d989f2e87286e0	108815	image/png	2026-03-04 14:59:55.329906+08
41	103	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a7f4963f24d3.66485073.png	/server/handlers/staff/business/uploads/biz_69a7f4963f24d3.66485073.png	102f611873e76c5630f24c22e972886e	207245	image/png	2026-03-04 17:00:06.31649+08
42	103	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a7f4963fd752.51183231.png	/server/handlers/staff/business/uploads/biz_69a7f4963fd752.51183231.png	102f611873e76c5630f24c22e972886e	207245	image/png	2026-03-04 17:00:06.364562+08
43	104	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a806a48bcf36.03633534.png	/server/handlers/staff/business/uploads/biz_69a806a48bcf36.03633534.png	102f611873e76c5630f24c22e972886e	207245	image/png	2026-03-04 18:17:08.601028+08
44	104	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a806a48caa98.16824764.png	/server/handlers/staff/business/uploads/biz_69a806a48caa98.16824764.png	102f611873e76c5630f24c22e972886e	207245	image/png	2026-03-04 18:17:08.617235+08
45	105	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a825a2510370.96835685.pdf	/server/handlers/staff/business/uploads/biz_69a825a2510370.96835685.pdf	8ab4acea8c4305d66917076c3940a444	107679	application/pdf	2026-03-04 20:29:22.362798+08
46	106	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a87fa4e70cb5.67041193.pdf	/server/handlers/staff/business/uploads/biz_69a87fa4e70cb5.67041193.pdf	8ab4acea8c4305d66917076c3940a444	107679	application/pdf	2026-03-05 02:53:25.026628+08
47	107	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a908290bd354.55501799.pdf	/server/handlers/staff/business/uploads/biz_69a908290bd354.55501799.pdf	8ab4acea8c4305d66917076c3940a444	107679	application/pdf	2026-03-05 12:35:53.116171+08
\.


--
-- TOC entry 6226 (class 0 OID 44170)
-- Dependencies: 235
-- Data for Name: business_ocr_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_ocr_results (id, application_id, filename, saved_filename, file_url, ocr_result, created_at) FROM stdin;
1	60	1770192689_Emotional_Poetry_Collection_3.pdf	1770192689_Emotional_Poetry_Collection_3.pdf	/server/handlers/staff/business/uploads/1770192689_Emotional_Poetry_Collection_3.pdf	{"text": "", "detected": []}	2026-02-04 16:11:30.256164
2	61	1770194417_Emotional_Poetry_Collection_3.pdf	1770194417_Emotional_Poetry_Collection_3.pdf	/server/handlers/staff/business/uploads/1770194417_Emotional_Poetry_Collection_3.pdf	{"text": "", "detected": []}	2026-02-04 16:40:20.135667
3	62	1770194505_Emotional_Poetry_Collection_3.pdf	1770194505_Emotional_Poetry_Collection_3.pdf	/server/handlers/staff/business/uploads/1770194505_Emotional_Poetry_Collection_3.pdf	{"text": "", "detected": []}	2026-02-04 16:41:47.976557
4	63	1770196441_olyid.jpg	1770196441_olyid.jpg	/server/handlers/staff/business/uploads/1770196441_olyid.jpg	{"text": "", "detected": []}	2026-02-04 17:16:09.421459
5	63	1770197471_olyid.jpg	1770197471_olyid.jpg	/server/handlers/staff/business/uploads/1770197471_olyid.jpg	{"text": "", "detected": []}	2026-02-04 17:31:12.234726
6	63	1770196441_olyid.jpg	1770196441_olyid.jpg	/server/handlers/staff/business/uploads/1770196441_olyid.jpg	{"text": "199\\nQUEZON CITY\\nUNIVERSIT\\n673 Quirino Highway, San Bartolom\\nNovaliches, Quezon City\\n22-0392\\nGENATO\\nChristopher Angelo A.\\nBSIT", "detected": []}	2026-02-04 18:07:50.930528
7	63	1770197471_olyid.jpg	1770197471_olyid.jpg	/server/handlers/staff/business/uploads/1770197471_olyid.jpg	{"text": "199\\nQUEZON CITY\\nUNIVERSIT\\n673 Quirino Highway, San Bartolom\\nNovaliches, Quezon City\\n22-0392\\nGENATO\\nChristopher Angelo A.\\nBSIT", "detected": []}	2026-02-04 18:07:50.94516
8	62	1770194505_Emotional_Poetry_Collection_3.pdf	1770194505_Emotional_Poetry_Collection_3.pdf	/server/handlers/staff/business/uploads/1770194505_Emotional_Poetry_Collection_3.pdf	{"text": "", "detected": []}	2026-02-04 18:08:14.528886
9	65	1770206637_valid_id_test.jpg	1770206637_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770206637_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-04 20:08:00.70291
10	66	1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	{"text": "", "detected": []}	2026-02-04 21:41:48.66559
11	67	1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	{"text": "", "detected": []}	2026-02-04 21:41:53.111957
12	67	1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	{"text": "", "detected": []}	2026-02-04 21:42:43.886554
13	68	1770212617_valid_id_test.jpg	1770212617_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770212617_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-04 21:43:41.264266
14	69	1770224419_valid_id_test.jpg	1770224419_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770224419_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 01:00:23.562384
15	70	1770224497_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770224497_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770224497_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	{"text": "", "detected": []}	2026-02-05 01:01:42.779827
16	70	1770224582_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770224582_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770224582_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-05 01:03:06.751279
17	70	1770224647_valid_id_test.jpg	1770224647_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770224647_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 01:04:10.432075
23	71	1770228878_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770228878_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770228878_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	{"text": "", "detected": []}	2026-02-05 02:14:44.862017
67	92	users_export (33).pdf	biz_69a43c9bf19584.52207731.pdf	/server/handlers/staff/business/uploads/biz_69a43c9bf19584.52207731.pdf	{"text": "", "detected": []}	2026-03-01 21:18:20.003701
18	70	1770224729_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770224729_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770224729_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-05 01:05:32.876411
19	70	1770227016_valid_id_test.jpg	1770227016_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770227016_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 01:43:40.205402
20	70	1770227038_valid_id_test.jpg	1770227038_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770227038_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 01:44:01.374802
21	70	1770227211_valid_id_test.jpg	1770227211_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770227211_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 01:46:56.079951
22	70	1770228712_valid_id_test.jpg	1770228712_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770228712_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 02:11:55.644409
24	72	1770228971_test_business_print.pdf	1770228971_test_business_print.pdf	/server/handlers/staff/business/uploads/1770228971_test_business_print.pdf	{"text": "30/01/2026, 16:30\\nBarangay Blue Ridge B - Business Clearance\\nRepublic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nHON. MARIA DELA CRUZ\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 3]\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 71\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. JUAN M. DELOS SANTOS\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nTO WHOM IT MAY CONCERN:\\nThis clearance is hereby granted to\\nJeferson Putorez Oliven\\nwith business address at Barangay Blue Ridge B, Quezon City,\\nto operate or engage in business trade or occupation in the vicinity\\nof the Barangay for:\\nBusiness Name/Trade Name:\\nGun's Shop\\n• NEW\\n• RENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party\\nfor whatever purposes it may serve.\\nIssued this\\n28\\nday of\\nJanuary\\n,20\\n26.\\nIssued at OR No.:\\nN/A\\nDate Issued:\\n2026-01-28\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nMR. JUAN M. DELOS SANTOS\\nBarangay Secretary\\nApproved by:\\nHON. MARIA DELA CRUZ\\nPunong Barangay\\nabout:blank\\n1/1", "detected": ["Previous Business Permit"]}	2026-02-05 02:16:15.897776
25	70	1770236327_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	1770236327_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	/server/handlers/staff/business/uploads/1770236327_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	{"text": "", "detected": []}	2026-02-05 04:18:51.16521
26	70	1770236842_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770236842_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770236842_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-05 04:27:26.06683
27	70	1770236946_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770236946_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770236946_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-05 04:29:09.820673
28	70	1770237026_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770237026_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770237026_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-05 04:30:30.270403
29	70	1770237330_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770237330_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770237330_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-05 04:35:34.560535
68	92	users_export (33).pdf	users_export (33).pdf	/server/handlers/staff/business/uploads/users_export (33).pdf	{"text": "", "detected": []}	2026-03-01 21:18:20.996148
71	94	applicationsTable_export (3).pdf	biz_69a442ba11d956.86102641.pdf	/server/handlers/staff/business/uploads/biz_69a442ba11d956.86102641.pdf	{"text": "", "detected": []}	2026-03-01 21:44:26.175055
30	70	1770237577_valid_id_test.jpg	1770237577_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770237577_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 04:39:40.435454
31	70	1770237751_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770237751_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770237751_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-05 04:42:35.865698
32	70	1770237792_valid_id_test.jpg	1770237792_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770237792_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 04:43:15.439773
33	72	1770238040_valid_id_test.jpg	1770238040_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770238040_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 04:47:23.756581
34	70	1770238793_valid_id_test.jpg	1770238793_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770238793_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 04:59:56.997626
35	71	1770239407_valid_id_test.jpg	1770239407_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770239407_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 05:10:10.698292
36	70	1770239514_valid_id_test.jpg	1770239514_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770239514_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 05:11:56.930557
37	71	1770262033_localhost_8080_Banwa_client_pages_resident_construction_app.php.png	1770262033_localhost_8080_Banwa_client_pages_resident_construction_app.php.png	/server/handlers/staff/business/uploads/1770262033_localhost_8080_Banwa_client_pages_resident_construction_app.php.png	{"text": "Select Construction Location\\n+\\nKatipuna:\\nvulected Location\\nShel\\nOcampo\\nQ'\\nMilagrosa-\\nLokal ng\\nProject\\nPetron\\nunrisers Alley\\nLibis\\n+\\nHighland Drive\\nBlue Ridge A\\nCPB\\nCrest Line Street\\nLibis Elementory\\nSchools\\nHoly Angels\\nMontessori\\nSchool\\n- Colonel Bonny Serrano Avenue\\nin am Street\\nClick on the map to select location: 14.618937, 121.070935\\ncei\\nCapricorn Street\\nBlue Ridge\\nLibra Street\\nIndustrial Valley\\n# +\\nBlue Ridge\\nUnion Lane Comets Loop\\nBlue Ridge\\nTwin Peaks Drive\\nRiverview Dri\\nMil\\nColonel Bonny Serrano Avenue\\nCur Lady\\nof Mount\\nCarmel\\nCamp Atienza\\nP. Mejia Street\\nAstoria Street\\nWoodsi\\nLibis\\nBonny Serrano Flyover\\nPasco Street\\nBucyo creek\\nO. De Guzman St.\\n4. Caparas Street\\nC.5 Access Road\\nClose\\n-e.5-Access-\\n-Marikina-River,\\nPasig\\nSquare\\nGarden\\n3rd District\\nBagumbayan\\n- Marikina River-\\nSantolan Dike Road\\nM. de Leon V\\nHalf Court-\\nOpen:\\nEnergy\\nPlant\\n: Leaflet\\nÂ© OpenStreetMap contributors", "detected": []}	2026-02-05 11:27:18.403109
38	71	1770272683_valid_id_test.jpg	1770272683_valid_id_test.jpg	/server/handlers/staff/business/uploads/1770272683_valid_id_test.jpg	{"text": "SOD\\nGUTTONI\\nCITIZEN CURLO\\nKASAMA KA SA PAG-UNLAD\\nPILIPINAS\\nLast Name, First Na\\nMURING, JEFERSON ISMAEL\\nSex\\nDate\\nM\\n2003/09/12\\nStatus\\nSINGLE\\nBlood Type\\nDate\\nSaved\\n2022/09/12\\n30 BLOCK 2 POOK PALARIS UP.\\nCAMPUS, QUEZON CITY\\nValid Until\\n2032/09/12\\nCardholder Signature\\nRESIDENT\\n13400000783056\\nIn case of Emergency, contact:\\nMURING, GAVINA i. @ 0855 575 6619", "detected": []}	2026-02-05 14:24:46.959117
69	93	users_export (33).pdf	biz_69a43d89347470.77184016.pdf	/server/handlers/staff/business/uploads/biz_69a43d89347470.77184016.pdf	{"text": "", "detected": []}	2026-03-01 21:22:17.263008
70	93	users_export (33).pdf	users_export (33).pdf	/server/handlers/staff/business/uploads/users_export (33).pdf	{"text": "", "detected": []}	2026-03-01 21:22:18.279459
72	94	applicationsTable_export (3).pdf	applicationsTable_export (3).pdf	/server/handlers/staff/business/uploads/applicationsTable_export (3).pdf	{"text": "", "detected": []}	2026-03-01 21:44:27.148028
73	95	applicationsTable_export (3).pdf	biz_69a444b31796c2.67680915.pdf	/server/handlers/staff/business/uploads/biz_69a444b31796c2.67680915.pdf	{"text": "", "detected": []}	2026-03-01 21:52:51.144214
74	95	applicationsTable_export (3).pdf	applicationsTable_export (3).pdf	/server/handlers/staff/business/uploads/applicationsTable_export (3).pdf	{"text": "", "detected": []}	2026-03-01 21:52:52.130471
75	96	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	biz_69a59808e694f9.84067787.jpg	/server/handlers/staff/business/uploads/biz_69a59808e694f9.84067787.jpg	{"text": "", "detected": []}	2026-03-02 22:00:41.026049
39	73	1770389466_Barangay-Blue-Ridge-B-Business-Clearance.pdf	1770389466_Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/1770389466_Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "Republic of the Philippines\\nQuezon City\\nDistrict III\\nBARANGAY BLUE RIDGE B\\nOFFICE OF THE BARANGAY CHAIRMAN\\nBARANGAY BUSINESS CLEARANCE\\nTO WHOM IT MAY CONCERN:\\nHON. [CAPTAIN NAME]\\nPunong Barangay\\nKAGAWADS\\nHON. [KAGAWAD 1]\\nHON. [KAGAWAD 2]\\nHON. [KAGAWAD 31\\nHON. [KAGAWAD 4]\\nHON. [KAGAWAD 5]\\nHON. [KAGAWAD 6]\\nHON. [KAGAWAD 7]\\nHON. ISK CHAIR NAME]\\nS.K Chairperson\\nMR. [SECRETARY NAME\\nBrgy. Secretary\\nMR. [TREASURER NAME]\\nBrgy. Treasurer\\nThis clearance is hereby granted to\\n{grantee_name}}\\nwith business address at Barangay Blue Ridge B, Quezon City, to operate\\nor engage in business trade or occupation in the vicinity of the Barangay for:\\nNature of business:\\n{ {nature_of_business} }\\nVNEW\\nDRENEWAL\\n• CLOSURE\\nAs having been complied with the requirements of the Barangay.\\nThis clearance is issued upon request of the herein interested party for\\nwhatever purposes it may serve.\\nIssued this {{day)) day of\\n{{month}}\\n,20 kiyear;;.\\nIssued at OR No.:\\n¿for_number};\\nDate Issued:\\n{{date_issued,;\\nIssued at:\\nBarangay Blue Ridge B Hall\\nAttested by:\\nApproved by:\\nMR. [SECRETARY NAME]\\nBarangay Secretary\\nHON. [CAPTAIN NAMEI\\nPunong Barangay", "detected": ["Previous Business Permit"]}	2026-02-06 22:51:09.692163
40	78	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	biz_69a3fd20d837f2.24689459.png	/server/handlers/staff/business/uploads/biz_69a3fd20d837f2.24689459.png	{"text": "", "detected": []}	2026-03-01 16:47:29.011745
41	79	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a4208342bbe9.27188619.pdf	/server/handlers/staff/business/uploads/biz_69a4208342bbe9.27188619.pdf	{"text": "", "detected": []}	2026-03-01 19:18:27.32747
42	79	Barangay-Blue-Ridge-B-Business-Clearance.pdf	Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "", "detected": []}	2026-03-01 19:18:28.415271
43	80	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a4224c2ecc10.78655682.pdf	/server/handlers/staff/business/uploads/biz_69a4224c2ecc10.78655682.pdf	{"text": "", "detected": []}	2026-03-01 19:26:04.255332
44	80	Barangay-Blue-Ridge-B-Business-Clearance.pdf	Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "", "detected": []}	2026-03-01 19:26:05.201069
45	81	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a42303600162.03058848.pdf	/server/handlers/staff/business/uploads/biz_69a42303600162.03058848.pdf	{"text": "", "detected": []}	2026-03-01 19:29:07.435368
46	81	Barangay-Blue-Ridge-B-Business-Clearance.pdf	Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "", "detected": []}	2026-03-01 19:29:08.440022
47	82	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	biz_69a42504157903.75238390.png	/server/handlers/staff/business/uploads/biz_69a42504157903.75238390.png	{"text": "", "detected": []}	2026-03-01 19:37:40.11734
48	82	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	{"text": "", "detected": []}	2026-03-01 19:37:41.0856
49	83	users_export (32).pdf	biz_69a426fb80eba1.54907259.pdf	/server/handlers/staff/business/uploads/biz_69a426fb80eba1.54907259.pdf	{"text": "", "detected": []}	2026-03-01 19:46:03.562091
50	83	users_export (32).pdf	users_export (32).pdf	/server/handlers/staff/business/uploads/users_export (32).pdf	{"text": "", "detected": []}	2026-03-01 19:46:04.51401
51	84	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	biz_69a429528c4000.45881504.png	/server/handlers/staff/business/uploads/biz_69a429528c4000.45881504.png	{"text": "", "detected": []}	2026-03-01 19:56:02.627952
52	84	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_incidentReport.php.png	{"text": "", "detected": []}	2026-03-01 19:56:03.679457
53	85	applicationsTable_export (3).pdf	biz_69a429e837cf51.02647301.pdf	/server/handlers/staff/business/uploads/biz_69a429e837cf51.02647301.pdf	{"text": "", "detected": []}	2026-03-01 19:58:32.244723
54	85	applicationsTable_export (3).pdf	applicationsTable_export (3).pdf	/server/handlers/staff/business/uploads/applicationsTable_export (3).pdf	{"text": "", "detected": []}	2026-03-01 19:58:33.170842
55	86	users_export (33).pdf	biz_69a42a56748b28.47735258.pdf	/server/handlers/staff/business/uploads/biz_69a42a56748b28.47735258.pdf	{"text": "", "detected": []}	2026-03-01 20:00:22.495385
56	86	users_export (33).pdf	users_export (33).pdf	/server/handlers/staff/business/uploads/users_export (33).pdf	{"text": "", "detected": []}	2026-03-01 20:00:23.426082
57	87	applicationsTable_export (3).pdf	biz_69a42b20d20504.63482783.pdf	/server/handlers/staff/business/uploads/biz_69a42b20d20504.63482783.pdf	{"text": "", "detected": []}	2026-03-01 20:03:44.911141
58	87	applicationsTable_export (3).pdf	applicationsTable_export (3).pdf	/server/handlers/staff/business/uploads/applicationsTable_export (3).pdf	{"text": "", "detected": []}	2026-03-01 20:03:45.865342
59	88	applicationsTable_export (3).pdf	biz_69a42c646008f9.26455309.pdf	/server/handlers/staff/business/uploads/biz_69a42c646008f9.26455309.pdf	{"text": "", "detected": []}	2026-03-01 20:09:08.444427
60	88	applicationsTable_export (3).pdf	applicationsTable_export (3).pdf	/server/handlers/staff/business/uploads/applicationsTable_export (3).pdf	{"text": "", "detected": []}	2026-03-01 20:09:09.37575
61	89	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a438d046b1c4.88310628.pdf	/server/handlers/staff/business/uploads/biz_69a438d046b1c4.88310628.pdf	{"text": "", "detected": []}	2026-03-01 21:02:08.359863
62	89	Barangay-Blue-Ridge-B-Business-Clearance.pdf	Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "", "detected": []}	2026-03-01 21:02:09.386062
63	90	applicationsTable_export (1).pdf	biz_69a43a3a520427.22705037.pdf	/server/handlers/staff/business/uploads/biz_69a43a3a520427.22705037.pdf	{"text": "", "detected": []}	2026-03-01 21:08:10.379645
64	90	applicationsTable_export (1).pdf	applicationsTable_export (1).pdf	/server/handlers/staff/business/uploads/applicationsTable_export (1).pdf	{"text": "", "detected": []}	2026-03-01 21:08:11.463386
65	91	users_export (33).pdf	biz_69a43c664a8734.02930583.pdf	/server/handlers/staff/business/uploads/biz_69a43c664a8734.02930583.pdf	{"text": "", "detected": []}	2026-03-01 21:17:26.352873
66	91	users_export (33).pdf	users_export (33).pdf	/server/handlers/staff/business/uploads/users_export (33).pdf	{"text": "", "detected": []}	2026-03-01 21:17:27.415755
76	96	users_export (33).pdf	biz_69a59808e7dd45.15664057.pdf	/server/handlers/staff/business/uploads/biz_69a59808e7dd45.15664057.pdf	{"text": "", "detected": []}	2026-03-02 22:00:41.040819
77	96	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	biz_69a59808e852e5.40939999.jpg	/server/handlers/staff/business/uploads/biz_69a59808e852e5.40939999.jpg	{"text": "", "detected": []}	2026-03-02 22:00:41.053569
78	96	users_export (33).pdf	biz_69a59808e92967.54253452.pdf	/server/handlers/staff/business/uploads/biz_69a59808e92967.54253452.pdf	{"text": "", "detected": []}	2026-03-02 22:00:41.056286
79	96	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	/server/handlers/staff/business/uploads/e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	{"text": "", "detected": []}	2026-03-02 22:00:45.184476
80	96	users_export (33).pdf	users_export (33).pdf	/server/handlers/staff/business/uploads/users_export (33).pdf	{"text": "", "detected": []}	2026-03-02 22:00:45.185326
81	96	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	/server/handlers/staff/business/uploads/e0472144-71ee-46b7-902d-cb92d0203c2e.jpg	{"text": "", "detected": []}	2026-03-02 22:00:45.187098
82	96	users_export (33).pdf	users_export (33).pdf	/server/handlers/staff/business/uploads/users_export (33).pdf	{"text": "", "detected": []}	2026-03-02 22:00:45.187797
83	97	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c031840853.80737608.png	/server/handlers/staff/business/uploads/biz_69a7c031840853.80737608.png	{"text": "", "detected": []}	2026-03-04 13:16:33.625191
84	97	localhost_8080_Banwa_client_pages_resident_status.php (4).png	localhost_8080_Banwa_client_pages_resident_status.php (4).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (4).png	{"text": "", "detected": []}	2026-03-04 13:16:34.552699
85	98	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c152957f77.80596756.png	/server/handlers/staff/business/uploads/biz_69a7c152957f77.80596756.png	{"text": "", "detected": []}	2026-03-04 13:21:22.644098
86	98	localhost_8080_Banwa_client_pages_resident_status.php (4).png	localhost_8080_Banwa_client_pages_resident_status.php (4).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (4).png	{"text": "", "detected": []}	2026-03-04 13:21:23.597417
87	99	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c1ec1e2dc8.09941198.png	/server/handlers/staff/business/uploads/biz_69a7c1ec1e2dc8.09941198.png	{"text": "", "detected": []}	2026-03-04 13:23:56.160794
88	99	localhost_8080_Banwa_client_pages_resident_status.php (4).png	localhost_8080_Banwa_client_pages_resident_status.php (4).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (4).png	{"text": "", "detected": []}	2026-03-04 13:23:57.092027
89	100	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c32e5a6db9.64220571.png	/server/handlers/staff/business/uploads/biz_69a7c32e5a6db9.64220571.png	{"text": "", "detected": []}	2026-03-04 13:29:18.386992
90	100	localhost_8080_Banwa_client_pages_resident_status.php (4).png	localhost_8080_Banwa_client_pages_resident_status.php (4).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (4).png	{"text": "", "detected": []}	2026-03-04 13:29:19.339282
91	101	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7c3484cd889.62898576.png	/server/handlers/staff/business/uploads/biz_69a7c3484cd889.62898576.png	{"text": "", "detected": []}	2026-03-04 13:29:44.32885
92	101	localhost_8080_Banwa_client_pages_resident_status.php (4).png	localhost_8080_Banwa_client_pages_resident_status.php (4).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (4).png	{"text": "", "detected": []}	2026-03-04 13:29:45.252666
93	102	localhost_8080_Banwa_client_pages_resident_status.php (4).png	biz_69a7d86b48bb02.70676189.png	/server/handlers/staff/business/uploads/biz_69a7d86b48bb02.70676189.png	{"text": "", "detected": []}	2026-03-04 14:59:55.344147
94	102	localhost_8080_Banwa_client_pages_resident_status.php (4).png	localhost_8080_Banwa_client_pages_resident_status.php (4).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (4).png	{"text": "", "detected": []}	2026-03-04 14:59:56.228579
95	103	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a7f4963f24d3.66485073.png	/server/handlers/staff/business/uploads/biz_69a7f4963f24d3.66485073.png	{"text": "", "detected": []}	2026-03-04 17:00:06.346831
96	103	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a7f4963fd752.51183231.png	/server/handlers/staff/business/uploads/biz_69a7f4963fd752.51183231.png	{"text": "", "detected": []}	2026-03-04 17:00:06.365634
97	103	localhost_8080_Banwa_client_pages_resident_status.php (1).png	localhost_8080_Banwa_client_pages_resident_status.php (1).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (1).png	{"text": "", "detected": []}	2026-03-04 17:00:09.699195
98	103	localhost_8080_Banwa_client_pages_resident_status.php (1).png	localhost_8080_Banwa_client_pages_resident_status.php (1).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (1).png	{"text": "", "detected": []}	2026-03-04 17:00:09.70028
99	104	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a806a48bcf36.03633534.png	/server/handlers/staff/business/uploads/biz_69a806a48bcf36.03633534.png	{"text": "", "detected": []}	2026-03-04 18:17:08.610147
100	104	localhost_8080_Banwa_client_pages_resident_status.php (1).png	biz_69a806a48caa98.16824764.png	/server/handlers/staff/business/uploads/biz_69a806a48caa98.16824764.png	{"text": "", "detected": []}	2026-03-04 18:17:08.618431
101	104	localhost_8080_Banwa_client_pages_resident_status.php (1).png	localhost_8080_Banwa_client_pages_resident_status.php (1).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (1).png	{"text": "", "detected": []}	2026-03-04 18:17:10.598404
102	104	localhost_8080_Banwa_client_pages_resident_status.php (1).png	localhost_8080_Banwa_client_pages_resident_status.php (1).png	/server/handlers/staff/business/uploads/localhost_8080_Banwa_client_pages_resident_status.php (1).png	{"text": "", "detected": []}	2026-03-04 18:17:10.599265
103	105	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a825a2510370.96835685.pdf	/server/handlers/staff/business/uploads/biz_69a825a2510370.96835685.pdf	{"text": "", "detected": []}	2026-03-04 20:29:22.374295
104	105	Barangay-Blue-Ridge-B-Business-Clearance.pdf	Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "", "detected": []}	2026-03-04 20:29:23.314677
105	106	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a87fa4e70cb5.67041193.pdf	/server/handlers/staff/business/uploads/biz_69a87fa4e70cb5.67041193.pdf	{"text": "", "detected": []}	2026-03-05 02:53:25.071694
106	106	Barangay-Blue-Ridge-B-Business-Clearance.pdf	Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "", "detected": []}	2026-03-05 02:53:26.00333
107	106	1772650586_valid_id_3.jpg	1772650586_valid_id_3.jpg	/server/handlers/staff/business/uploads/1772650586_valid_id_3.jpg	{"text": "", "detected": []}	2026-03-05 02:56:31.175946
108	107	Barangay-Blue-Ridge-B-Business-Clearance.pdf	biz_69a908290bd354.55501799.pdf	/server/handlers/staff/business/uploads/biz_69a908290bd354.55501799.pdf	{"text": "", "detected": []}	2026-03-05 12:35:53.140313
109	107	Barangay-Blue-Ridge-B-Business-Clearance.pdf	Barangay-Blue-Ridge-B-Business-Clearance.pdf	/server/handlers/staff/business/uploads/Barangay-Blue-Ridge-B-Business-Clearance.pdf	{"text": "", "detected": []}	2026-03-05 12:35:54.081596
\.


--
-- TOC entry 6228 (class 0 OID 44178)
-- Dependencies: 237
-- Data for Name: construction_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.construction_applications (id, supabase_user_id, first_name, middle_name, last_name, suffix, contact_no_owner, owner_address, nature_of_work, type_of_work, nature_of_activity, details_of_work, start_date, end_date, number_of_working_days, number_of_workers, contractor_name, contractor_contact_number, application_method, construction_address, latitude, longitude, requirement_upload, agreed, application_date, request_date, status, approval_comments, disapproval_reason, created_at, updated_at, payment_status, amount_due, amount_paid, or_number, payment_date, payment_method, dss_status, requirement_upload_json) FROM stdin;
4	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	\N	residential	Demolition	sd fds fd	2026-01-21	2026-01-23	3	3	Jed	09123232342	Online	20 Comets Loop	14.61739800	121.07380400	localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	0	2026-01-21	\N	Complied			2026-01-21 13:23:37.433535	2026-01-23 01:05:02.66833	\N	\N	\N	\N	\N	\N	\N	\N
5	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	\N	commercial	Demolition	sd	2026-01-23	2026-01-24	2	3	jed	04556463245	Online	8 Milkyway Dr	14.61676900	121.07567300	localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	0	2026-01-23	\N	Pending	\N	\N	2026-01-23 22:42:02.978035	2026-01-23 22:42:02.978035	\N	\N	\N	\N	\N	\N	\N	\N
6	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	\N	residential	Major Construction	New second flood	2026-01-25	2026-01-29	5	3	Jerry	09898762342	Online	8 Twin Peaks Dr	14.61767300	121.07525100	1769353068_69762f6cd712d.jpg	0	2026-01-25	\N	Pending	\N	\N	2026-01-25 22:57:48.888091	2026-01-25 22:57:48.932109	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
7	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	\N	residential	Repairs	Repairs Roof	2026-01-26	2026-01-29	4	2	Jep	09234536756	Online	8 Riverview Dr	14.61813000	121.07725900	1769424850_697747d274b87.png	0	2026-01-26	\N	Pending	\N	\N	2026-01-26 18:54:10.484048	2026-01-26 18:54:10.536691	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
8	\N	Jeferson	Putorez	Oliven	Jr	09123412341	15 Moonlight Loop	\N	addition	Repairs	Add new second floor	2026-01-26	2026-01-28	3	3	Jep	09788123465	Online	15 Comets Loop	14.61661500	121.07361200	1769427714_69775302e405d.jpg	0	2026-01-26	\N	Pending	\N	\N	2026-01-26 19:41:54.942533	2026-01-26 19:41:54.984784	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
9	\N	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	\N	renovation	Repairs	New second floor	2026-01-26	2026-01-30	5	4	Jeppoy	09879762365	In Person	5 Colonel Bonny Serrano Ave.	14.61650000	121.07569000	\N	0	2026-01-26	\N	Pending	\N	\N	2026-01-26 19:48:21.413206	2026-01-26 19:48:21.425062	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
1	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	Demolition	residential	Major Construction	A quick brown fox jumps over the lazy dog	2026-01-17	2026-01-20	4	5	Soliven Soliridad Estabilo	09123412342	Online	2 Crest line St	14.61641100	121.07304900	localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png	0	2026-01-17	\N	Additional Requirements			2026-01-17 00:45:32.068901	2026-01-19 22:51:07.798313	\N	\N	\N	\N	\N	\N	\N	\N
2	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	Demolition	residential	Major Construction	sd oi qwe	2026-01-17	2026-01-23	7	23	Mark Erilees Potugal	09123412341	Online	3 Hillside Dr	14.61712400	121.07335600	3ece29dc-0b82-4242-97b2-ad038fdc8107.jpg	0	2026-01-17	\N	Pending	\N	\N	2026-01-17 01:08:41.942264	2026-01-17 01:08:41.942264	\N	\N	\N	\N	\N	\N	\N	\N
3	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	Major Construction	residential	Minor Construction	dd ff gg hh	2026-01-19	2026-01-21	3	4	Soriano Sumesidoz Espinoza	09234223442	Online	8 Moonlight Loop	14.61927300	121.07503900	localhost_8080_Banwa_client_pages_resident_construction_app.php (2).png	0	2026-01-19	\N	Pending	\N	\N	2026-01-19 01:11:36.500807	2026-01-19 01:11:36.500807	\N	\N	\N	\N	\N	\N	\N	\N
12	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	\N	residential	Demolition	TEST TEST TEST	2026-01-27	2026-01-30	4	3	Jeppy	09123464564	Online	21 Twin Peaks Dr	14.61744400	121.07472100	1769450642_6977ac922f5e2.jpg	0	2026-01-27	\N	For Payment	Application is complete. Proceed to payment.	\N	2026-01-27 02:04:02.199895	2026-01-27 02:07:36.005388	Unpaid	1000.00	\N	\N	\N	\N	Pre-Approved	\N
11	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		14.61807000	121.07617100	1769449357_6977a78d6c8ec.png	0	2026-01-26	\N	Pre-Approved	Application is complete. Proceed to payment.	\N	2026-01-26 19:57:17.808046	2026-01-27 01:52:31.887874	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
10	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Comets Loop	\N	repair	Repairs	new roof	2026-01-29	2026-02-05	8	3	Jeppoy	09127456675	Online	1 Colonel Bonny Serrano Ave.	14.61648300	121.07514600	1770197869_6983136dd0148.png	0	2026-01-26	\N	Complied	Please visit the Barangay Hall for physical verification.	\N	2026-01-26 19:50:43.369237	2026-02-04 17:37:49.869246	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
13	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Union Lane	\N	residential	Demolition	asda	2026-02-05	2026-02-13	9	2	asdasd	09123123123	In Person	3 Union Lane	14.61797100	121.07385400	1770229664_69838fa0e6abd.pdf	0	2026-02-05	\N	Complied	Please visit the Barangay Hall for physical verification.	\N	2026-02-05 02:27:02.947223	2026-02-05 02:27:44.952335	\N	\N	\N	\N	\N	\N	Pre-Approved	\N
14	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Twin Peaks Dr	\N	residential	Repairs	Patangal ng bakod	2026-02-12	2026-02-14	3	2	Jeff tomas	09919926620	Online	3 Twin Peaks Dr	14.61682700	121.07468200	1770887230_698d983e4281f.png	0	2026-02-12	\N	Pending	\N	\N	2026-02-12 01:07:10.276351	2026-02-12 01:07:10.33312	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
15	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Starline Rd	\N	repair	Demolition	Pagpintura bakod	2026-02-15	2026-02-17	3	2	Yd	09123455665	Online	3 Starline Rd	14.61953000	121.07556500	1771152675_6991a5239684a.png	0	2026-02-15	\N	Pending	\N	\N	2026-02-15 02:51:15.620046	2026-02-15 02:51:15.655579	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	\N
16	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	4 Starline Rd	\N	repair	Repairs	Repair ng Bakod	2026-02-15	2026-02-17	3	2	Jef	09123678123	Online	3 Twin Peaks Dr	14.61682700	121.07468200	\N	0	2026-02-15	\N	Pending	\N	\N	2026-02-15 07:54:17.374185	2026-02-15 07:54:17.403826	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
17	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	5 Starline Rd	\N	repair	Minor Construction	Pagawa Bakod	2026-02-15	2026-02-17	3	4	Jef	09123687612	Online	5 Starline Rd	14.61934700	121.07574600	\N	0	2026-02-15	\N	Pending	\N	\N	2026-02-15 07:56:46.539216	2026-02-15 07:56:46.546955	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
18	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Union Lane	\N	commercial	Major Construction	akshjgdas	2026-02-16	2026-02-18	3	4	akjsd	09183265487	Online	4 Starline Rd	14.61942800	121.07565100	\N	0	2026-02-16	\N	Pending	\N	\N	2026-02-15 08:20:54.151673	2026-02-15 08:20:54.163896	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
19	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Starline Rd	\N	demolition	Demolition	demolishing the bakod	2026-02-16	2026-02-18	3	3	Jef	09124687162	Online	2 Starline Rd	14.61963400	121.07545900	\N	0	2026-02-16	\N	Pending	\N	\N	2026-02-15 08:40:10.021545	2026-02-15 08:40:10.038939	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
20	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Moonlight Loop	\N	demolition	Demolition	tanggal bakod	2026-02-16	2026-02-18	3	3	jef	09128476518	Online	3 Moonlight Loop	14.61850300	121.07469200	\N	0	2026-02-16	\N	Pending	\N	\N	2026-02-15 08:48:55.803681	2026-02-15 08:48:55.812103	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
21	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	4 Moonlight Loop	\N	residential	Minor Construction	pagawa ng bakod	2026-02-16	2026-02-18	3	3	Jed	09187234582	Online	3 Moonlight Loop	14.61850300	121.07469200	\N	0	2026-02-16	\N	Pending	\N	\N	2026-02-15 08:56:16.542718	2026-02-15 08:56:16.55058	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
22	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Twin Peaks Dr	\N	demolition	Demolition	Mehh	2026-02-17	2026-02-17	1	2	kid	09127368712	Online	3 Twin Peaks Dr	14.61682700	121.07468200	\N	0	2026-02-17	\N	Pending	\N	\N	2026-02-17 03:57:01.517735	2026-02-17 03:57:01.613146	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
23	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	4 Twin Peaks Dr	\N	demolition	Demolition	bruhh	2026-02-17	2026-02-17	1	3	Ben	09382367512	Online	3 Twin Peaks Dr	14.61682700	121.07468200	\N	0	2026-02-17	\N	Pending	\N	\N	2026-02-17 04:13:49.679193	2026-02-17 04:13:49.689163	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
24	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	3 Twin Peaks Dr	\N	demolition	Demolition	mnbremn	2026-02-17	2026-02-17	1	2	Neb	09123781685	Online	2 Starline Rd	14.61963400	121.07545900	\N	0	2026-02-17	\N	Pending	\N	\N	2026-02-17 04:29:11.915866	2026-02-17 04:29:11.941951	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
25	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	4 Twin Peaks Dr	\N	demolition	Demolition	Pagiba bakod	2026-02-17	2026-02-17	1	2	Connor	09123681275	Online	4 Twin Peaks Dr	14.61695000	121.07476100	\N	0	2026-02-17	\N	Pending	\N	\N	2026-02-17 05:00:53.365299	2026-02-17 05:00:53.392584	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_6994668558ba1_Screenshot 2026-02-07 143954.png", "filename": "Screenshot 2026-02-07 143954.png", "saved_filename": "const_6994668558ba1_Screenshot 2026-02-07 143954.png"}]
26	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	4 Comets Loop	\N	demolition	Demolition	Patangal Bakod	2026-02-17	2026-02-18	2	3	Benn	09876543211	Online	4 Comets Loop	14.61701900	121.07401700	\N	0	2026-02-17	\N	Pending	\N	\N	2026-02-17 05:18:09.883728	2026-02-17 05:18:09.893677	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69946a91d72ae_Screenshot 2026-02-07 143954.png", "filename": "Screenshot 2026-02-07 143954.png", "saved_filename": "const_69946a91d72ae_Screenshot 2026-02-07 143954.png"}]
27	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	4 Riverview Dr	\N	demolition	Demolition	patangal	2026-02-17	2026-02-17	1	2	Benn	09876523648	Online	4 Riverview Dr	14.61740900	121.07616900	\N	0	2026-02-17	\N	Pending	\N	\N	2026-02-17 05:47:07.205304	2026-02-17 05:47:07.23156	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_6994715b3188f_Screenshot 2026-02-07 143954.png", "filename": "Screenshot 2026-02-07 143954.png", "saved_filename": "const_6994715b3188f_Screenshot 2026-02-07 143954.png"}]
30	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341		\N	residential	Demolition	fdgsfg	2026-03-01	2026-03-16	16	4	asdf	45663456345	Online	3 Comets Loop	14.61684900	121.07390600	\N	0	2026-03-01	\N	For Payment	Application is complete. Proceed to payment.	\N	2026-03-01 22:45:17.64501	2026-03-01 23:12:40.26097	Unpaid	1000.00	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a450fd98880_applicationsTable_export (1).pdf", "filename": "applicationsTable_export (1).pdf", "saved_filename": "const_69a450fd98880_applicationsTable_export (1).pdf"}]
33	staff_1772621273384	Ken	\N	Somali		09123412341		\N	residential	Minor Construction	5	2026-03-04	2026-03-11	\N	3	Ken	09123412341	Online	6 Comets Loop	14.61724100	121.07414700	\N	1	2026-03-04	\N	Pending	\N	\N	2026-03-04 18:47:53.595121	2026-03-04 18:47:53.632187	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[]
31	staff_1772617472726	Ken	\N	Soriano		09123412341		\N	residential	Minor Construction	pagawa bubong	2026-03-04	2026-03-12	\N	4	Ken	09123412341	Online	6 Twin Peaks Dr	\N	\N	\N	1	2026-03-04	\N	Pre-Approved	Application is complete. Proceed to payment.	\N	2026-03-04 17:44:33.202431	2026-03-04 17:46:56.568748	\N	\N	\N	\N	\N	\N	Rejected	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a7ff012b147_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a7ff012b147_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}]
28	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	12 Twin Peaks Dr	\N	demolition	Demolition	test lng	2026-02-17	2026-02-17	1	1	Bennten	09876651234	Online	12 Twin Peaks Dr	14.61839900	121.07538500	\N	0	2026-02-17	\N	Additional Requirements	Missing	\N	2026-02-17 05:54:27.450953	2026-02-26 01:15:59.806599	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_699473136d80e_Screenshot 2026-02-07 143954.png", "filename": "Screenshot 2026-02-07 143954.png", "saved_filename": "const_699473136d80e_Screenshot 2026-02-07 143954.png"}]
29	db1d1ed3-3042-48ce-8b1e-b371402836f5	Jeferson	Putorez	Oliven	Jr	09123412341	15 Twin Peaks Dr	\N	residential	Major Construction	tanggal bubong	2026-04-02	2026-04-07	6	5	jex	08067567856	Online	4 Comets Loop	14.61701900	121.07401700	\N	0	2026-03-01	\N	Pending	\N	\N	2026-03-01 21:47:09.635454	2026-03-01 21:47:09.752483	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a4435d98949_applicationsTable_export (3).pdf", "filename": "applicationsTable_export (3).pdf", "saved_filename": "const_69a4435d98949_applicationsTable_export (3).pdf"}]
32	staff_1772618851561	ken	\N	Soriano		09123412341		\N	residential	Demolition	patanggal ng pangalawang bahay	2026-03-04	2026-03-12	\N	3	Ken	09123412341	Online	6 Riverview Dr	14.61853400	121.07742300	\N	1	2026-03-04	\N	Pending	\N	\N	2026-03-04 18:07:31.723034	2026-03-04 18:07:31.808448	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a80463ac250_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a80463ac250_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}]
34	staff_1772622838661	Jen	\N	Soriano		09123412341		\N	residential	Minor Construction	to fix my roof	2026-03-04	2026-03-11	\N	4	Ken	09123412341	Online	6 Moonlight Loop	14.61903200	121.07492900	\N	1	2026-03-04	\N	Pending	\N	\N	2026-03-04 19:13:59.10108	2026-03-04 19:13:59.155724	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a813f714347_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a813f714347_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}]
35	staff_1772623157141	Jerry	\N	Quinto		09123412341		\N	residential	Minor Construction	paayos bubong	2026-03-04	2026-03-18	4	4	Ken	09123412341	Online	6 Twin Peaks Dr	14.61729700	121.07500000	\N	1	2026-03-04	\N	Pending	\N	\N	2026-03-04 19:19:17.682049	2026-03-04 19:19:17.729822	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a81535a3110_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a81535a3110_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}]
36	staff_1772623656630	jen	\N	Ken		09123412341		\N	residential	Minor Construction	aayos bubong	2026-03-04	2026-03-06	3	3	Ken	09123412341	In Person	6 Colonel Bonny Serrano Ave.	14.61658300	121.07583100	\N	1	2026-03-04	\N	Pending	\N	\N	2026-03-04 19:27:37.064823	2026-03-04 19:27:37.098235	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a817290dcdb_localhost_8080_Banwa_client_pages_resident_status.php (1).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (1).png", "saved_filename": "const_69a817290dcdb_localhost_8080_Banwa_client_pages_resident_status.php (1).png"}]
37	staff_1772624342729	jep		orki		09123412341		\N	residential	Minor Construction	ayus bubong	2026-03-04	2026-03-06	3	3	Ken	09123412341	In Person	6 Twin Peaks Dr	14.61729700	121.07500000	\N	1	2026-03-04	\N	Pending	\N	\N	2026-03-04 19:39:03.180242	2026-03-04 19:39:03.225006	\N	\N	\N	\N	\N	\N	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a819d729160_localhost_8080_Banwa_client_pages_resident_status.php (1).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (1).png", "saved_filename": "const_69a819d729160_localhost_8080_Banwa_client_pages_resident_status.php (1).png"}]
38	d1b6349d-f242-458e-b576-42fb8bbe0f5d	Jeferson	Ismael	Muring		09132456778		\N	residential	Minor Construction	Papaayos lang po ng bubong	2026-03-05	2026-03-13	9	4	Ken	09123412341	In Person	6 Colonel Bonny Serrano Ave.	14.61658300	121.07583100	\N	0	2026-03-05	\N	Approved	Application is complete.	\N	2026-03-05 03:07:47.536936	2026-03-05 03:16:58.128423	Paid	350.00	350.00	098892341231	2026-03-05 03:16:12.102515	GCash	Additional Requirements Needed	[{"file_url": "/server/handlers/staff/construction/uploads/const_69a8830381883_valid_id_3.jpg", "filename": "valid_id_3.jpg", "saved_filename": "const_69a8830381883_valid_id_3.jpg"}]
\.


--
-- TOC entry 6230 (class 0 OID 44193)
-- Dependencies: 239
-- Data for Name: construction_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.construction_evaluations (id, application_id, dss_status, evaluation_details, evaluated_at) FROM stdin;
1	6	Additional Requirements Needed	{"score": 4, "rule_id": "CR2", "max_score": 7, "failed_rules": ["Complete Requirements Rule", "Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 3 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: Complete Requirements Rule, Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 57.14, "failed_rules_details": {"CR1": "Complete Requirements Rule", "CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-01-25 22:57:48.923003
2	7	Additional Requirements Needed	{"score": 5, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": [], "passed_critical": ["CR1", "CR2", "CR3", "CR4"], "recommendations": ["Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 2 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-01-26 18:54:10.526941
3	8	Additional Requirements Needed	{"score": 5, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": [], "passed_critical": ["CR1", "CR2", "CR3", "CR4"], "recommendations": ["Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 3 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-01-26 19:41:54.975394
4	9	Additional Requirements Needed	{"score": 4, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance, Existing Structure Assessment", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 4 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 57.14, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-01-26 19:48:21.423289
6	11	Additional Requirements Needed	{"score": 4, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Contractor Qualification Rule", "Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": ["CR4"], "passed_critical": ["CR1", "CR2", "CR3"], "recommendations": ["Contractor information is incomplete or invalid. Please provide valid contractor name (minimum 3 characters) and 11-digit contact number.", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 0 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: Contractor Qualification Rule, Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 57.14, "failed_rules_details": {"CR4": "Contractor Qualification Rule", "CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-01-27 01:42:37.468267
7	12	Pre-Approved	{"score": 6, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Schedule Validation Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": [], "passed_critical": ["CR1", "CR2", "CR3", "CR4"], "recommendations": ["Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Construction permit meets all safety and regulatory requirements. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"CR6": "Owner Agreement Rule"}}	2026-01-27 02:04:02.228405
5	10	Additional Requirements Needed	{"score": 5, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": [], "passed_critical": ["CR1", "CR2", "CR3", "CR4"], "recommendations": ["Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 3 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-02-04 17:37:49.864191
8	13	Pre-Approved	{"score": 6, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Schedule Validation Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": [], "passed_critical": ["CR1", "CR2", "CR3", "CR4"], "recommendations": ["Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Construction permit meets all safety and regulatory requirements. All critical rules passed with sufficient overall score.", "approval_probability": 85.71, "failed_rules_details": {"CR6": "Owner Agreement Rule"}}	2026-02-05 01:27:09.279132
9	14	Additional Requirements Needed	{"score": 5, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": [], "passed_critical": ["CR1", "CR2", "CR3", "CR4"], "recommendations": ["Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 8 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-02-06 22:53:11.632449
10	15	Additional Requirements Needed	{"score": 5, "rule_id": "CR1", "max_score": 7, "failed_rules": ["Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "File Upload Rule", "failed_critical": [], "passed_critical": ["CR1", "CR2", "CR3", "CR4"], "recommendations": ["Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 8 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-02-06 23:06:06.479705
11	29	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Owner Agreement Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Schedule Validation Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR6": "Owner Agreement Rule"}}	2026-03-01 21:47:09.733659
12	30	Additional Requirements Needed	{"score": 4, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule", "Owner Agreement Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 4 workers.", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 57.14, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule", "CR6": "Owner Agreement Rule"}}	2026-03-01 22:45:17.759387
13	31	Rejected	{"score": 4, "rule_id": "CR3", "max_score": 7, "failed_rules": ["File Upload Rule", "Valid Construction Location Rule", "Schedule Validation Rule"], "passed_rules": ["Construction Safety Compliance Rule", "Contractor Qualification Rule", "Owner Agreement Rule", "Environmental Impact Rule"], "triggered_rule": "Construction Safety Compliance Rule", "failed_critical": ["CR1", "CR2"], "passed_critical": ["CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction site appears to be outside Barangay Blue Ridge B boundaries. Please verify the address or consider relocating within barangay jurisdiction.", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 4 workers."], "rejection_reason": "Failed critical safety/location rules: CR1, CR2", "status_explanation": "Application failed critical safety or location rules: CR1, CR2. Cannot proceed with current information.", "approval_probability": 57.14, "failed_rules_details": {"CR1": "File Upload Rule", "CR2": "Valid Construction Location Rule", "CR5": "Schedule Validation Rule"}}	2026-03-04 17:44:33.311239
14	32	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Owner Agreement Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 3 workers."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule"}}	2026-03-04 18:07:31.775787
15	33	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Owner Agreement Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 3 workers."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule"}}	2026-03-04 18:47:53.629209
16	34	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Owner Agreement Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 4 workers."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule"}}	2026-03-04 19:13:59.151972
17	35	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Owner Agreement Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 4 workers."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule"}}	2026-03-04 19:19:17.727145
18	36	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Owner Agreement Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 3 workers."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule"}}	2026-03-04 19:27:37.095572
19	37	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Schedule Validation Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Owner Agreement Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Construction schedule validation failed. Please ensure: 1) Start date is in the future, 2) End date is after start date, 3) Working days fit within schedule, 4) Duration is appropriate for 3 workers."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Schedule Validation Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR5": "Schedule Validation Rule"}}	2026-03-04 19:39:03.219264
20	38	Additional Requirements Needed	{"score": 5, "rule_id": "CR2", "max_score": 7, "failed_rules": ["File Upload Rule", "Owner Agreement Rule"], "passed_rules": ["Valid Construction Location Rule", "Construction Safety Compliance Rule", "Contractor Qualification Rule", "Schedule Validation Rule", "Environmental Impact Rule"], "triggered_rule": "Valid Construction Location Rule", "failed_critical": ["CR1"], "passed_critical": ["CR2", "CR3", "CR4"], "recommendations": ["Please submit the following missing construction documents: Building Plan, Contractor License, Barangay Clearance", "Owner agreement or information is incomplete. Please ensure: 1) Check agreement box, 2) Provide valid owner name, 3) Provide valid 11-digit contact number."], "status_explanation": "Some safety or documentation requirements need attention. Failed rules: File Upload Rule, Owner Agreement Rule. Please address the recommendations.", "approval_probability": 71.43, "failed_rules_details": {"CR1": "File Upload Rule", "CR6": "Owner Agreement Rule"}}	2026-03-05 03:09:41.789998
\.


--
-- TOC entry 6232 (class 0 OID 44204)
-- Dependencies: 241
-- Data for Name: construction_ocr_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.construction_ocr_results (id, application_id, filename, saved_filename, file_url, ocr_result, created_at) FROM stdin;
1	25	Screenshot 2026-02-07 143954.png	Screenshot 2026-02-07 143954.png	/server/handlers/staff/construction/uploads/Screenshot 2026-02-07 143954.png	{"text": "PS C: \\\\Program Files Microsoft Office» cd \\"C: \\\\Program Files \\\\Microsoft Office|root\\\\Office16\\"\\nPS C: \\\\Program Files Microsoft Office\\\\root \\\\Officel6> cscript ospp.vbs /dstatus\\nMicrosoft (R) Windows Script Host Version 5.812\\nCopyright (C) Microsoft Corporation. All rights reserved.\\n---Processing-\\nPRODUCT ID: 00202-60000-00000-AA563\\nSKU ID: e3dacc06-3bc2-4e13-8e59-8e05f3232325\\nLICENSE NAME: Office 16, Office160365ProPlusR_Subscription2 edition\\n¿ LICENSE DESCRIPTION: Office 16, TIMEBASED_SUB channel\\nLICENSE STATUS:\\n---0OB_GRACE---\\nERROR CODE: 0x4004F00C\\nERROR DESCRIPTION: The\\nSoftware Licensing Service reported that the application is running within the valid grace period\\nREMAINING GRACE: 9 days (14390 minute(s) before expiring)\\ni Last 5 characters of installed product key: C7GP3\\n---Exiting--\\nPS C: \\\\Program Files Microsoft Office\\\\root\\\\Office16> |", "detected": []}	2026-02-17 05:15:29.937208
2	26	Screenshot 2026-02-07 143954.png	Screenshot 2026-02-07 143954.png	/server/handlers/staff/construction/uploads/Screenshot 2026-02-07 143954.png	{"text": "PS C: \\\\Program Files Microsoft Office» cd \\"C: \\\\Program Files \\\\Microsoft Office|root\\\\Office16\\"\\nPS C: \\\\Program Files Microsoft Office\\\\root \\\\Officel6> cscript ospp.vbs /dstatus\\nMicrosoft (R) Windows Script Host Version 5.812\\nCopyright (C) Microsoft Corporation. All rights reserved.\\n---Processing-\\nPRODUCT ID: 00202-60000-00000-AA563\\nSKU ID: e3dacc06-3bc2-4e13-8e59-8e05f3232325\\nLICENSE NAME: Office 16, Office160365ProPlusR_Subscription2 edition\\n¿ LICENSE DESCRIPTION: Office 16, TIMEBASED_SUB channel\\nLICENSE STATUS:\\n---0OB_GRACE---\\nERROR CODE: 0x4004F00C\\nERROR DESCRIPTION: The\\nSoftware Licensing Service reported that the application is running within the valid grace period\\nREMAINING GRACE: 9 days (14390 minute(s) before expiring)\\ni Last 5 characters of installed product key: C7GP3\\n---Exiting--\\nPS C: \\\\Program Files Microsoft Office\\\\root\\\\Office16> |", "detected": []}	2026-02-17 05:18:12.098122
3	27	Screenshot 2026-02-07 143954.png	Screenshot 2026-02-07 143954.png	/server/handlers/staff/construction/uploads/Screenshot 2026-02-07 143954.png	{"text": "PS C: \\\\Program Files Microsoft Office» cd \\"C: \\\\Program Files \\\\Microsoft Office|root\\\\Office16\\"\\nPS C: \\\\Program Files Microsoft Office\\\\root \\\\Officel6> cscript ospp.vbs /dstatus\\nMicrosoft (R) Windows Script Host Version 5.812\\nCopyright (C) Microsoft Corporation. All rights reserved.\\n---Processing-\\nPRODUCT ID: 00202-60000-00000-AA563\\nSKU ID: e3dacc06-3bc2-4e13-8e59-8e05f3232325\\nLICENSE NAME: Office 16, Office160365ProPlusR_Subscription2 edition\\n¿ LICENSE DESCRIPTION: Office 16, TIMEBASED_SUB channel\\nLICENSE STATUS:\\n---0OB_GRACE---\\nERROR CODE: 0x4004F00C\\nERROR DESCRIPTION: The\\nSoftware Licensing Service reported that the application is running within the valid grace period\\nREMAINING GRACE: 9 days (14390 minute(s) before expiring)\\ni Last 5 characters of installed product key: C7GP3\\n---Exiting--\\nPS C: \\\\Program Files Microsoft Office\\\\root\\\\Office16> |", "detected": []}	2026-02-17 05:47:08.465756
4	28	Screenshot 2026-02-07 143954.png	Screenshot 2026-02-07 143954.png	/server/handlers/staff/construction/uploads/Screenshot 2026-02-07 143954.png	{"text": "PS C: \\\\Program Files Microsoft Office» cd \\"C: \\\\Program Files \\\\Microsoft Office|root\\\\Office16\\"\\nPS C: \\\\Program Files Microsoft Office\\\\root \\\\Officel6> cscript ospp.vbs /dstatus\\nMicrosoft (R) Windows Script Host Version 5.812\\nCopyright (C) Microsoft Corporation. All rights reserved.\\n---Processing-\\nPRODUCT ID: 00202-60000-00000-AA563\\nSKU ID: e3dacc06-3bc2-4e13-8e59-8e05f3232325\\nLICENSE NAME: Office 16, Office160365ProPlusR_Subscription2 edition\\n¿ LICENSE DESCRIPTION: Office 16, TIMEBASED_SUB channel\\nLICENSE STATUS:\\n---0OB_GRACE---\\nERROR CODE: 0x4004F00C\\nERROR DESCRIPTION: The\\nSoftware Licensing Service reported that the application is running within the valid grace period\\nREMAINING GRACE: 9 days (14390 minute(s) before expiring)\\ni Last 5 characters of installed product key: C7GP3\\n---Exiting--\\nPS C: \\\\Program Files Microsoft Office\\\\root\\\\Office16> |", "detected": []}	2026-02-17 05:54:30.192331
5	28	Screenshot 2026-02-07 143954.png	Screenshot 2026-02-07 143954.png	/server/handlers/staff/construction/uploads/Screenshot 2026-02-07 143954.png	{"text": "PS C: \\\\Program Files Microsoft Office» cd \\"C: \\\\Program Files \\\\Microsoft Office|root\\\\Office16\\"\\nPS C: \\\\Program Files Microsoft Office\\\\root \\\\Officel6> cscript ospp.vbs /dstatus\\nMicrosoft (R) Windows Script Host Version 5.812\\nCopyright (C) Microsoft Corporation. All rights reserved.\\n---Processing-\\nPRODUCT ID: 00202-60000-00000-AA563\\nSKU ID: e3dacc06-3bc2-4e13-8e59-8e05f3232325\\nLICENSE NAME: Office 16, Office160365ProPlusR_Subscription2 edition\\n¿ LICENSE DESCRIPTION: Office 16, TIMEBASED_SUB channel\\nLICENSE STATUS:\\n---0OB_GRACE---\\nERROR CODE: 0x4004F00C\\nERROR DESCRIPTION: The\\nSoftware Licensing Service reported that the application is running within the valid grace period\\nREMAINING GRACE: 9 days (14390 minute(s) before expiring)\\ni Last 5 characters of installed product key: C7GP3\\n---Exiting--\\nPS C: \\\\Program Files Microsoft Office\\\\root\\\\Office16> |", "detected": []}	2026-02-17 06:13:47.846977
6	28	Screenshot 2026-02-07 143954.png	Screenshot 2026-02-07 143954.png	/server/handlers/staff/construction/uploads/Screenshot 2026-02-07 143954.png	{"text": "PS C: \\\\Program Files Microsoft Office» cd \\"C: \\\\Program Files \\\\Microsoft Office|root\\\\Office16\\"\\nPS C: \\\\Program Files Microsoft Office\\\\root \\\\Officel6> cscript ospp.vbs /dstatus\\nMicrosoft (R) Windows Script Host Version 5.812\\nCopyright (C) Microsoft Corporation. All rights reserved.\\n---Processing-\\nPRODUCT ID: 00202-60000-00000-AA563\\nSKU ID: e3dacc06-3bc2-4e13-8e59-8e05f3232325\\nLICENSE NAME: Office 16, Office160365ProPlusR_Subscription2 edition\\n¿ LICENSE DESCRIPTION: Office 16, TIMEBASED_SUB channel\\nLICENSE STATUS:\\n---0OB_GRACE---\\nERROR CODE: 0x4004F00C\\nERROR DESCRIPTION: The\\nSoftware Licensing Service reported that the application is running within the valid grace period\\nREMAINING GRACE: 9 days (14390 minute(s) before expiring)\\ni Last 5 characters of installed product key: C7GP3\\n---Exiting--\\nPS C: \\\\Program Files Microsoft Office\\\\root\\\\Office16> |", "detected": []}	2026-02-17 06:34:51.017235
7	28	Screenshot 2026-02-07 143954.png	Screenshot 2026-02-07 143954.png	/server/handlers/staff/construction/uploads/Screenshot 2026-02-07 143954.png	{"text": "PS C: \\\\Program Files Microsoft Office» cd \\"C: \\\\Program Files \\\\Microsoft Office|root\\\\Office16\\"\\nPS C: \\\\Program Files Microsoft Office\\\\root \\\\Officel6> cscript ospp.vbs /dstatus\\nMicrosoft (R) Windows Script Host Version 5.812\\nCopyright (C) Microsoft Corporation. All rights reserved.\\n---Processing-\\nPRODUCT ID: 00202-60000-00000-AA563\\nSKU ID: e3dacc06-3bc2-4e13-8e59-8e05f3232325\\nLICENSE NAME: Office 16, Office160365ProPlusR_Subscription2 edition\\n¿ LICENSE DESCRIPTION: Office 16, TIMEBASED_SUB channel\\nLICENSE STATUS:\\n---0OB_GRACE---\\nERROR CODE: 0x4004F00C\\nERROR DESCRIPTION: The\\nSoftware Licensing Service reported that the application is running within the valid grace period\\nREMAINING GRACE: 9 days (14390 minute(s) before expiring)\\ni Last 5 characters of installed product key: C7GP3\\n---Exiting--\\nPS C: \\\\Program Files Microsoft Office\\\\root\\\\Office16> |", "detected": []}	2026-02-17 06:40:03.28122
\.


--
-- TOC entry 6257 (class 0 OID 44531)
-- Dependencies: 266
-- Data for Name: fault_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fault_lines (fault_line_id, fault_name, fault_type, description, risk_level, properties, geom, created_at, updated_at) FROM stdin;
1	Blue Ridge B Fault Line	active	Active fault line running through Barangay Blue Ridge B. Construction within 50m is prohibited.	critical	{"critical_distance": 50, "high_risk_distance": 100, "medium_risk_distance": 200}	0102000020E610000004000000E9263108AC445E4008AC1C5A643B2D40CDCCCCCCCC445E4096438B6CE73B2D40B0726891ED445E4023DBF97E6A3C2D40931804560E455E40B0726891ED3C2D40	2026-02-11 17:10:01.359772	2026-02-11 17:10:01.359772
\.


--
-- TOC entry 6261 (class 0 OID 44563)
-- Dependencies: 270
-- Data for Name: house_polygons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.house_polygons (house_id, osm_id, address, street_name, house_number, coordinates, center_lat, center_lng, area_sqm, created_at, updated_at) FROM stdin;
19	\N	2 Milkyway Ln	Milkyway Ln	2	[[121.07543595135215, 14.616360673649844], [121.07563376426698, 14.616399604722822], [121.07559688389301, 14.616621511707107], [121.07544064521791, 14.616589718030134]]	14.61649288	121.07552681	0.04	2025-12-08 13:14:48.074022	2026-02-24 20:59:01.105043
13	\N	3 Milkyway Ln	Milkyway Ln	3	[[121.07523545622828, 14.616612752225144], [121.07539504766466, 14.616595557685432], [121.07538834214212, 14.616355158413947], [121.07522774487735, 14.616351914157487]]	14.61647885	121.07531165	0.04	2025-12-08 12:21:16.878322	2026-02-24 20:59:21.050377
5	\N	12 Twin Peaks Dr	Twin Peaks Dr	12	[[121.07469365000728, 14.617074408891767], [121.07482708990575, 14.61700498202004], [121.0749498009682, 14.617207422930525], [121.07483044266702, 14.617276849738285]]	14.61714092	121.07482525	0.03	2025-12-08 10:40:20.865348	2026-02-24 23:39:59.876355
1	\N	2 Twin Peaks Dr	Twin Peaks Dr	2	[[121.07434961294807, 14.616509909392153], [121.07444945661072, 14.616665633536927], [121.07459165352681, 14.616568630384702], [121.0745070494941, 14.61641907025673]]	14.61654081	121.07447444	0.03	2025-12-07 20:46:21.664513	2026-02-24 19:50:01.885572
2	\N	4 Twin peaks Dr	Twin peaks Dr	4	[[121.07444588094953, 14.6166682289384], [121.07460781931877, 14.616566034982046], [121.07480261474849, 14.61667698841816], [121.0745642334223, 14.61682168199627]]	14.61668323	121.07460514	0.05	2025-12-07 20:54:14.960276	2026-02-24 19:50:06.0323
3	\N	6 Twin Peaks Dr	Twin Peaks Dr	6	[[121.07464335858823, 14.616929715480115], [121.07479322701695, 14.616835956693874], [121.07471711933616, 14.616726301038444], [121.07457596808673, 14.61681486907208]]	14.61682671	121.07468242	0.02	2025-12-07 20:58:30.088723	2026-02-24 19:50:10.144442
4	\N	8 Twin Peaks Dr	Twin Peaks Dr	8	[[121.07462659478189, 14.616940745922914], [121.0748063027859, 14.616834334569182], [121.0748901218176, 14.61695956255938], [121.0747191309929, 14.617064027304872]]	14.61694967	121.07476054	0.03	2025-12-08 10:35:30.938647	2026-02-24 19:50:15.574317
192	\N	1 Hillside Loop	Hillside Loop	1	[[121.07504516657636, 14.619931869442382], [121.07536380069892, 14.619789077403352], [121.0753000738744, 14.61969885874901], [121.07506730326276, 14.619826722586293]]	14.61981163	121.07519409	356.68	2026-02-24 20:29:52.338081	2026-02-24 20:29:52.338081
15	\N	381 Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	381	[[121.07493035495283, 14.616666282387294], [121.07492431998256, 14.61634964317791], [121.07506446540357, 14.61634964317791], [121.07507050037385, 14.616662389285034]]	14.61650699	121.07499741	0.04	2025-12-08 12:26:20.122473	2026-02-25 00:05:32.497511
14	\N	383 Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	383	[[121.07506245374681, 14.616358078244732], [121.07507519423963, 14.616615023201975], [121.07522942125799, 14.616607236995572], [121.07521802186967, 14.616351589731826]]	14.61648298	121.07514627	0.04	2025-12-08 12:25:18.388762	2026-02-25 00:05:58.9061
20	\N	389 Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	389	[[121.07564985752107, 14.616404146680896], [121.0756089538336, 14.616569603660693], [121.07573099434379, 14.616596206536018], [121.07576988637447, 14.616431398427313]]	14.61650034	121.07568992	0.02	2025-12-08 13:18:33.836618	2026-02-25 00:06:39.66514
21	\N	391 Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	391	[[121.07576720416549, 14.616508611690488], [121.07589259743692, 14.616509909392153], [121.07589460909368, 14.616656874056709], [121.07576787471773, 14.616656874056709]]	14.61658307	121.07583057	0.02	2025-12-08 13:22:22.642232	2026-02-25 00:06:47.919798
9	\N	6 Milkyway Dr	Milkyway Dr	6	[[121.07491694390775, 14.616984867688625], [121.07511140406133, 14.616985516538053], [121.0751087218523, 14.617144484590519], [121.07492163777353, 14.617145133439475]]	14.61706500	121.07501468	0.03	2025-12-08 10:55:29.801544	2026-02-24 19:00:50.32466
10	\N	8 Milkyway Dr	Milkyway Dr	8	[[121.07488609850408, 14.616971241850155], [121.07497595250608, 14.616981947866162], [121.07513420283796, 14.61697578379641], [121.07518248260023, 14.616907330168003], [121.07499171048406, 14.616763609921428], [121.07487335801126, 14.616910898841091]]	14.61691847	121.07500730	0.04	2025-12-08 12:12:02.718725	2026-02-24 19:05:06.675799
11	\N	10 Milkyway Dr	Milkyway Dr	10	[[121.07497997581962, 14.616727274313735], [121.0750570893288, 14.6168125980973], [121.0751821473241, 14.616905708043845], [121.07525557279588, 14.616851204665295], [121.07524517923596, 14.616771071697272], [121.07514426112178, 14.616616320903017]]	14.61678070	121.07514404	0.04	2025-12-08 12:14:04.082566	2026-02-24 19:05:28.617166
18	\N	14 Milkyway Dr	Milkyway Dr	14	[[121.0754366219044, 14.61660074849002], [121.07567332684995, 14.616624107109114], [121.07559084892274, 14.616849258115806], [121.07544064521791, 14.61681811332172]]	14.61672306	121.07553536	0.04	2025-12-08 13:10:36.823243	2026-02-24 19:06:10.110613
25	\N	18 Milkyway Dr	Milkyway Dr	18	[[121.07570853084329, 14.616927444506517], [121.07589125633241, 14.616853800064579], [121.07594389468433, 14.616992978306351], [121.0757625102997, 14.61705948536045]]	14.61695843	121.07582655	0.03	2025-12-08 13:37:00.099385	2026-02-24 19:09:18.386602
26	\N	20 Milkyway Dr	Milkyway Dr	20	[[121.07577323913576, 14.617064027304872], [121.07595026493074, 14.616994600429862], [121.07599921524528, 14.61719379710587], [121.07578799128535, 14.6171762781872]]	14.61710718	121.07587768	0.03	2025-12-08 13:47:50.339193	2026-02-24 19:10:17.154594
52	\N	23 Milkyway Dr	Milkyway Dr	23	[[121.07543695718053, 14.617180171280364], [121.07566226273777, 14.617156163871472], [121.07566997408867, 14.617300857133984], [121.07544332742692, 14.617309292164279]]	14.61723662	121.07555313	0.03	2025-12-08 19:07:38.835791	2026-02-24 19:39:23.939941
38	\N	18 Twin Peaks Dr	Twin Peaks Dr	18	[[121.07508055865767, 14.617685623955849], [121.07534475624564, 14.617535415740486], [121.07542656362057, 14.617668429500116], [121.07515297830106, 14.617804038567279]]	14.61767338	121.07525121	0.04	2025-12-08 15:18:02.196003	2026-02-24 19:56:28.228843
39	\N	20 Twin Peaks Dr	Twin Peaks Dr	20	[[121.07515599578622, 14.617805985108308], [121.07538565993309, 14.617692112429367], [121.07544399797918, 14.617807607225812], [121.07521466910842, 14.617920506574883]]	14.61780655	121.07530008	0.03	2025-12-08 15:18:48.592149	2026-02-24 19:56:37.992301
193	\N	27 Moonlight Loop	Moonlight Loop	27	[[121.07506783585819, 14.619823865334054], [121.07529825863946, 14.619696650550324], [121.07511781187405, 14.619580513570666], [121.07506651193421, 14.61981933830483]]	14.61973009	121.07513760	301.36	2026-02-24 20:30:41.087993	2026-02-24 20:30:41.087993
196	\N	1 Hillside Ln	Hillside Ln	1	[[121.07542202591785, 14.619923365246091], [121.0752898766081, 14.619979832983557], [121.07535360343256, 14.620116783412978], [121.07549983972461, 14.62004603651933]]	14.62001650	121.07539134	270.64	2026-02-24 20:39:44.117607	2026-02-24 20:39:44.117607
40	\N	22 Twin Peaks Dr	Twin Peaks Dr	22	[[121.07546813786033, 14.617881900194808], [121.07546646147968, 14.618010696243088], [121.07522338628772, 14.618010696243088], [121.0752173513174, 14.617934781201091], [121.07528876513244, 14.61788546885207]]	14.61794471	121.07533282	0.03	2025-12-08 15:20:33.929313	2026-02-24 23:59:44.623174
36	\N	21 Starline Rd	Starline Rd	21	[[121.07590332627298, 14.61866927435252], [121.07611253857614, 14.618617042367644], [121.07619702816011, 14.618929785246873], [121.07602000236513, 14.618955090149168]]	14.61879280	121.07605822	0.06	2025-12-08 14:58:21.117156	2026-02-25 00:02:36.370796
47	\N	16 Twin Peaks Dr	Twin Peaks Dr	16	[[121.07544332742692, 14.618968391442795], [121.0756552219391, 14.618841218065894], [121.07573971152306, 14.61900861974056], [121.07553787529469, 14.619115678884224]]	14.61898348	121.07559403	0.04	2025-12-08 18:50:40.529561	2025-12-08 18:50:40.529561
29	\N	24 Milkyway Dr	Milkyway Dr	24	[[121.07576720416549, 14.617350169614234], [121.07604682445526, 14.61734108573712], [121.07605017721654, 14.617490969661398], [121.07577458024026, 14.617493565053126]]	14.61741895	121.07590970	0.04	2025-12-08 13:50:59.706216	2026-02-24 19:12:19.3543
30	\N	26 Milkyway Dr	Milkyway Dr	26	[[121.07577491551639, 14.61749680929274], [121.07604984194043, 14.61749421390105], [121.07605151832105, 14.617620090362648], [121.0757775977254, 14.617626254414333]]	14.61755934	121.07591347	0.04	2025-12-08 13:54:22.916929	2026-02-24 19:12:32.186476
31	\N	28 Milkyway Dr	Milkyway Dr	28	[[121.07577893882993, 14.617628200956927], [121.07602670788766, 14.617622685752849], [121.07602804899217, 14.617774516026305], [121.07578329741956, 14.617777435838223]]	14.61770071	121.07590425	0.04	2025-12-08 13:55:31.78118	2026-02-24 19:13:02.767818
33	\N	34 Milkyway Dr	Milkyway Dr	34	[[121.07578933238985, 14.618036650097567], [121.07581682503223, 14.618312409612173], [121.07606627047063, 14.618248822743048], [121.0760059207678, 14.618000314700428]]	14.61814955	121.07591959	0.06	2025-12-08 14:48:27.150238	2026-02-24 19:13:59.112235
34	\N	36 38 Milkyway Dr	Milkyway Dr	36 38	[[121.07582151889802, 14.618319546912662], [121.07608169317247, 14.618248173897337], [121.07614941895008, 14.618459697493448], [121.07587248086931, 14.618529772750305]]	14.61838930	121.07598128	0.06	2025-12-08 14:56:38.466009	2026-02-24 19:16:09.691757
35	\N	40 Milkyway Rd	Milkyway Dr	21	[[121.07587449252607, 14.618533990241904], [121.0761457309127, 14.618463590563852], [121.0761795938015, 14.618597577028488], [121.07591170817615, 14.618664732441278]]	14.61856497	121.07602788	0.04	2025-12-08 14:57:20.321828	2026-02-24 19:19:05.239994
48	\N	3 Milkyway Dr	Milkyway Dr	3	[[121.07517376542093, 14.617353413855975], [121.07538968324664, 14.617483183486025], [121.07545606791975, 14.617388451663645], [121.0754379630089, 14.617344329979], [121.07519723474981, 14.617269712403916]]	14.61736782	121.07533094	0.03	2025-12-08 19:03:14.947546	2026-02-24 19:20:04.527075
49	\N	5 Milkyway Dr	Milkyway Dr	5	[[121.07519991695884, 14.617265819312355], [121.07543863356115, 14.61734043688875], [121.07543226331474, 14.617149026533186], [121.07519187033178, 14.617147079986342]]	14.61722559	121.07531567	0.04	2025-12-08 19:05:04.504118	2026-02-24 19:20:22.321849
50	\N	7 Milkyway Dr	Milkyway Dr	7	[[121.07519220560792, 14.617143186892607], [121.07543092221023, 14.61714578228843], [121.07539840042591, 14.616862883961833], [121.07527904212476, 14.616890784501063], [121.07522338628772, 14.616944314595479], [121.07519354671243, 14.617007577417505]]	14.61699909	121.07528625	0.05	2025-12-08 19:05:46.169285	2026-02-24 19:20:58.165869
197	\N	3 Hillside Ln	Hillside Ln	3	[[121.07528743351567, 14.61998083980884], [121.07522075638944, 14.620010358739606], [121.07529320372682, 14.62015152800016], [121.07535189948624, 14.620118750777632]]	14.62006537	121.07528832	130.46	2026-02-24 20:40:20.746086	2026-02-24 20:40:20.746086
201	\N	21 Riverview Dr	Riverview Dr	21	[[121.07681467114855, 14.617808790115573], [121.07681467114855, 14.618052187775154], [121.07696493229268, 14.61805413495536], [121.07695889501457, 14.617802299507636]]	14.61792935	121.07688829	437.27	2026-02-24 20:53:02.223906	2026-02-24 20:53:02.223906
53	\N	25 Milkyway Dr	Milkyway Dr	25	[[121.07544500380756, 14.617309941012765], [121.075456738472, 14.617591541068403], [121.07571691274644, 14.617583754896605], [121.0757088661194, 14.617300208285485]]	14.61744636	121.07558188	0.07	2025-12-08 19:10:04.363804	2026-02-24 19:38:08.41394
55	\N	27 Milkyway Dr	Milkyway Dr	27	[[121.07544969767333, 14.617744020210559], [121.07545204460621, 14.61787865596088], [121.07568673789503, 14.61787249191628], [121.07568573206665, 14.617740127127396]]	14.61780882	121.07556855	0.03	2025-12-08 20:08:09.139045	2026-02-24 19:38:26.151009
56	\N	29 Milkyway Dr	Milkyway Dr	29	[[121.07546947896482, 14.617879629231057], [121.07547182589771, 14.61801491374465], [121.0757038369775, 14.617999990277209], [121.075705178082, 14.617876060573694]]	14.61794265	121.07558758	0.03	2025-12-08 20:08:42.79703	2026-02-24 19:38:36.946435
74	\N	2 Comets Loop	Comets Loop	2	[[121.07408042997123, 14.616606912570292], [121.07420414686204, 14.616837578818542], [121.07436373829843, 14.616737331491459], [121.07424035668376, 14.61654332520752]]	14.61668129	121.07422217	0.04	2025-12-09 16:54:47.061496	2026-02-24 19:41:44.607906
75	\N	4 Comets Loop	Comets Loop	4	[[121.0740552842617, 14.616569928086012], [121.07419811189175, 14.616832388019553], [121.0740465670824, 14.616896624148358], [121.07391446828844, 14.616644870324]]	14.61673595	121.07405361	0.05	2025-12-09 16:56:02.242226	2026-02-24 19:42:08.456619
76	\N	6 Comets Loop	Comets Loop	6	[[121.07404589653017, 14.616915440788604], [121.07384473085405, 14.617004333170664], [121.07381589710715, 14.616825899520656], [121.0739164799452, 14.61665200767866]]	14.61684942	121.07390575	0.04	2025-12-09 16:57:41.115222	2026-02-24 19:42:13.778152
77	\N	8 Comets Loop	Comets Loop	8	[[121.07384607195854, 14.617008226266869], [121.074106246233, 14.616884944853615], [121.07420414686204, 14.617026394048247], [121.07391245663166, 14.617154866173625]]	14.61701861	121.07401723	0.05	2025-12-09 16:58:55.972797	2026-02-24 19:44:26.78653
78	\N	10 Comets Loop	Comets Loop	10	[[121.07391513884069, 14.61715681272039], [121.07420817017557, 14.617028989445458], [121.07425712049009, 14.617117881781592], [121.0739701241255, 14.617254788885854]]	14.61713962	121.07408764	0.03	2025-12-09 16:59:37.173659	2026-02-24 19:44:38.619366
69	\N	3 Twin Peaks Dr	Twin Peaks Dr	3	[[121.07412703335288, 14.616887540252492], [121.07437111437322, 14.616735709366054], [121.07444487512113, 14.616838227668401], [121.07419945299627, 14.616994600429862]]	14.61686402	121.07428562	0.04	2025-12-09 16:34:52.130095	2026-02-24 19:51:43.912915
70	\N	5 Twin Peaks Dr	Twin Peaks Dr	5	[[121.07420247048141, 14.616995249279263], [121.0744431987405, 14.616840823067852], [121.07452400028708, 14.616955020612796], [121.07427388429645, 14.617099714007782]]	14.61697270	121.07436089	0.04	2025-12-09 16:38:33.647932	2026-02-24 19:51:50.256593
71	\N	7 Twin Peaks Dr	Twin Peaks Dr	7	[[121.07425779104234, 14.617111393291115], [121.0743382573128, 14.617219102208132], [121.074600443244, 14.617067595975428], [121.07452534139158, 14.61695566946231]]	14.61708844	121.07443046	0.04	2025-12-09 16:41:00.769465	2026-02-24 19:52:02.171625
72	\N	9 Twin Peaks Dr	Twin Peaks Dr	9	[[121.07432484626771, 14.617225266271065], [121.07437647879125, 14.617325188951284], [121.07464939355853, 14.617152270777888], [121.0746017843485, 14.617073111193436]]	14.61719396	121.07448813	0.03	2025-12-09 16:43:47.257674	2026-02-24 19:52:09.937987
194	\N	3 Hillside Loop	Hillside Loop	3	[[121.07516238564916, 14.619881943120383], [121.07522510626062, 14.620006237052483], [121.07545083338114, 14.619909852468947], [121.07536329284852, 14.619791075449253]]	14.61989728	121.07530040	395.22	2026-02-24 20:31:26.898388	2026-02-24 20:31:26.898388
64	\N	7 Riverview Dr	Riverview Dr	7	[[121.07593182474378, 14.616945287869804], [121.07599318027498, 14.617136049553887], [121.07619266957046, 14.617094847639544], [121.0761470720172, 14.616887215827644]]	14.61701585	121.07606619	0.04	2025-12-09 16:26:58.037286	2026-02-24 18:29:47.556283
68	\N	15 Riverview Dr	Riverview Dr	15	[[121.07611320912838, 14.617572724486068], [121.07613500207664, 14.617664860839332], [121.07626508921388, 14.617801118755716], [121.07638478279115, 14.617668105076413], [121.07629425823689, 14.617516274729425]]	14.61764462	121.07623847	0.04	2025-12-09 16:30:45.089032	2026-02-24 18:19:08.158445
67	\N	11 Riverview Dr	Riverview Dr	11	[[121.07603877782823, 14.617302154830979], [121.07610985636714, 14.617567209280605], [121.07630230486394, 14.61751011067466], [121.07622418552639, 14.617254788885854]]	14.61740857	121.07616878	0.05	2025-12-09 16:29:48.54493	2026-02-24 18:23:03.412954
65	\N	9 Riverview Dr	Riverview Dr	9	[[121.0759921744466, 14.617140591496732], [121.07603743672372, 14.617300208285485], [121.07622385025024, 14.617251869066989], [121.07618328183891, 14.617098091885062]]	14.61719769	121.07610919	0.03	2025-12-09 16:27:48.155106	2026-02-24 18:29:50.756481
57	\N	33 Milkyway Dr	Milkyway Dr	33	[[121.07549764215948, 14.618218326993153], [121.0757276415825, 14.618205998922848], [121.075723618269, 14.618041192021787], [121.07549294829369, 14.618054168947614]]	14.61812992	121.07561046	0.04	2025-12-08 20:09:22.253852	2026-02-24 19:35:18.331723
58	\N	35 Milkyway Dr	Milkyway Dr	35	[[121.07549764215948, 14.618219949107617], [121.07572697103024, 14.618206972191587], [121.07573300600055, 14.61833674131743], [121.07551272958518, 14.618365614937504]]	14.61828232	121.07561759	0.03	2025-12-08 20:10:12.106965	2026-02-24 19:35:27.884814
59	\N	37 Milkyway Dr	Milkyway Dr	37	[[121.07552010565998, 14.618372103390934], [121.07572797685862, 14.618345176307956], [121.07575714588167, 14.618497979349508], [121.0755539685488, 14.618539505423108]]	14.61843869	121.07563980	0.03	2025-12-08 20:11:10.403902	2026-02-24 19:35:39.272303
60	\N	39 Milkyway Dr	Milkyway Dr	39	[[121.0755553096533, 14.61854047869036], [121.07560191303494, 14.61870139215071], [121.07578933238985, 14.618636832127345], [121.07575748115781, 14.618500250306859]]	14.61859474	121.07567601	0.03	2025-12-08 20:11:46.473547	2026-02-24 19:35:53.274215
61	\N	41 Milkyway Dr	Milkyway Dr	41	[[121.07560358941556, 14.618703338683789], [121.07566259801389, 14.618849004193127], [121.07586946338415, 14.618722479591417], [121.0757913440466, 14.618635534438237]]	14.61872759	121.07573175	0.03	2025-12-08 20:12:23.316281	2026-02-24 19:36:04.21191
103	\N	19 Moonlight Loop	Moonlight Loop	19	[[121.07489642159803, 14.619264263912298], [121.07494913041593, 14.619383650936275], [121.0751881822944, 14.619281458243124], [121.07512146234514, 14.619163368849605]]	14.61927319	121.07503880	0.03	2025-12-10 07:56:49.649999	2026-02-24 20:43:26.724255
100	\N	14 Moonlight Loop	Moonlight Loop	14	[[121.0747328773141, 14.618904804763549], [121.07497226446868, 14.618794176874662], [121.07501719146968, 14.61891940374766], [121.07478618621828, 14.61902029892242]]	14.61890967	121.07487713	0.03	2025-12-10 07:52:05.915946	2026-02-24 23:55:31.560945
97	\N	4 Moonlight Loop	Moonlight Loop	4	[[121.07480227947237, 14.618590115314703], [121.07492633163932, 14.618584924557112], [121.07491828501226, 14.618366912628204], [121.0747915506363, 14.618375347617572]]	14.61847933	121.07485961	0.03	2025-12-10 07:46:20.558435	2026-02-24 23:56:39.079278
88	\N	24 Twin Peaks Dr	Twin Peaks Dr	24	[[121.07483413070443, 14.618106401066328], [121.07513520866634, 14.61806325279525], [121.07515230774881, 14.61823909005737], [121.0748599469662, 14.618276723106254]]	14.61817137	121.07499540	0.05	2025-12-09 19:52:05.941347	2025-12-09 19:52:05.941347
79	\N	12 Comets Loop	Comets Loop	12	[[121.07397347688678, 14.617256086583117], [121.0742598026991, 14.617122423724805], [121.07432350516322, 14.61722364414926], [121.0740328207612, 14.617362822156727]]	14.61724124	121.07414740	0.04	2025-12-09 17:00:24.185428	2026-02-24 19:45:15.633146
80	\N	14 Comets Loop	Comets Loop	14	[[121.07432182878257, 14.617228186090285], [121.07439760118723, 14.617364119853354], [121.07408210635188, 14.617492267357262], [121.07401974499228, 14.617371581608804]]	14.61736404	121.07420532	0.05	2025-12-09 17:01:15.670974	2026-02-24 19:45:20.347787
90	\N	4 Evening Glow Rd	Evening Glow Rd	4	[[121.07606291770936, 14.618189777776655], [121.07632510364057, 14.61812164894957], [121.0762754827738, 14.617943216207049], [121.0760206729174, 14.61802497086343]]	14.61806990	121.07617104	0.05	2025-12-09 19:58:58.161555	2026-02-24 15:31:43.113445
81	\N	16 Comets Loop	Comets Loop	16	[[121.0740837827325, 14.61749551159689], [121.07432015240192, 14.617406619413563], [121.07432652264836, 14.617521789936173], [121.07411395758392, 14.617562667346588]]	14.61749665	121.07421110	0.02	2025-12-09 17:02:14.52288	2026-02-24 19:45:25.050087
82	\N	18 Comets Loop	Comets Loop	18	[[121.07411395758392, 14.617564613889755], [121.07431277632716, 14.617526007447124], [121.07429634779695, 14.617703791681212], [121.07416156679395, 14.617663563144486]]	14.61761449	121.07422116	0.02	2025-12-09 19:34:02.878143	2026-02-24 19:45:34.7525
83	\N	20 Comets Loop	Comets Loop	20	[[121.07430238276721, 14.61769860090268], [121.07444386929275, 14.617724879217679], [121.07449516654017, 14.617428031402623], [121.07434898614886, 14.61740272632442]]	14.61756356	121.07439760	0.04	2025-12-09 19:35:01.778986	2026-02-24 19:45:40.597621
84	\N	24 Comets Loop	Comets Loop	24	[[121.0744495689869, 14.617716444203337], [121.07460848987104, 14.61772974557196], [121.07461184263231, 14.617507190859179], [121.07448846101762, 14.617497458140653]]	14.61761271	121.07453959	0.03	2025-12-09 19:35:51.678491	2026-02-24 19:46:09.042966
85	\N	26 Comets Loop	Comets Loop	26	[[121.07460949569942, 14.617728447877496], [121.07474863529207, 14.617703791681212], [121.07488006353381, 14.617559747531809], [121.07461351901294, 14.617514003761908]]	14.61762650	121.07471293	0.04	2025-12-09 19:36:57.927266	2026-02-24 19:46:14.681166
87	\N	27 Twin Peaks Dr	Twin Peaks Dr	27	[[121.07479959726335, 14.617965601413605], [121.07510268688203, 14.61788417115852], [121.07513822615148, 14.6180613062565], [121.07483245432378, 14.618105427797143]]	14.61800413	121.07496824	0.05	2025-12-09 19:51:18.615997	2026-02-24 19:57:52.632244
91	\N	29 Twin Peaks Dr	Twin Peaks Dr	29	[[121.07498399913312, 14.618734158788468], [121.07495516538621, 14.618575840731065], [121.07517477124931, 14.618549886940286], [121.07519723474981, 14.618682900085663]]	14.61863570	121.07507779	0.03	2025-12-09 20:01:16.597247	2026-02-24 19:59:35.81285
92	\N	31 Twin Peaks Dr	Twin Peaks Dr	31	[[121.07496354728939, 14.618740971653132], [121.0750148445368, 14.61890675129482], [121.07524484395984, 14.618813966618424], [121.07519220560792, 14.618687441996512]]	14.61878728	121.07510386	0.04	2025-12-09 20:01:44.049028	2026-02-24 19:59:41.332888
93	\N	33 Twin Peaks Dr	Twin Peaks Dr	33	[[121.07501719146968, 14.618908373404194], [121.07506949454547, 14.619037817694009], [121.07528775930406, 14.61893886905829], [121.07522606849672, 14.618824348122613]]	14.61892735	121.07515013	0.03	2025-12-09 20:02:23.489631	2026-02-24 20:00:06.347775
94	\N	35 Twin Peaks Dr	Twin Peaks Dr	35	[[121.0750725120306, 14.61903879095906], [121.07527602463962, 14.61894795286934], [121.07533805072309, 14.619075450606065], [121.07512749731542, 14.619172128229879]]	14.61905858	121.07520352	0.03	2025-12-09 20:03:10.973266	2026-02-24 20:00:13.534833
95	\N	37 Twin Peaks Dr	Twin Peaks Dr	37	[[121.07512917369604, 14.619174074758783], [121.07534106820823, 14.619077397135822], [121.07539571821691, 14.619190295832293], [121.07519187033178, 14.619284378035017]]	14.61918154	121.07526446	0.03	2025-12-09 20:03:53.985876	2026-02-24 20:00:21.881238
96	\N	26 Twin Peaks Dr	Twin Peaks Dr	26	[[121.07518114149572, 14.61854145195761], [121.07492901384832, 14.61856286383605], [121.0749249905348, 14.618374698772255], [121.0751684010029, 14.618375996462902]]	14.61846375	121.07505089	0.04	2025-12-10 07:44:17.040929	2026-02-24 20:06:09.23805
98	\N	6 Moonlight Loop	Moonlight Loop	6	[[121.07461318373683, 14.618625152925118], [121.07479691505434, 14.618591413004065], [121.07478618621828, 14.618374049926924], [121.07457026839259, 14.618422064475913]]	14.61850317	121.07469164	0.04	2025-12-10 07:48:20.632252	2026-02-24 20:06:27.659412
101	\N	16 Moonlight Loop	Moonlight Loop	16	[[121.07478752732278, 14.619023218717775], [121.07501953840257, 14.618921350278802], [121.07506748288871, 14.619041710754184], [121.07483949512246, 14.619140983765107]]	14.61903182	121.07492851	0.03	2025-12-10 07:52:40.052018	2026-02-24 20:06:53.666405
195	\N	2 Hillside Loop	Hillside Loop	2	[[121.07545427166029, 14.61979030068804], [121.07555220972743, 14.619936987053284], [121.07578565114773, 14.619795493127405], [121.07564880617718, 14.61966178777425]]	14.61979614	121.07561023	549.77	2026-02-24 20:31:52.103916	2026-02-24 20:31:52.103916
198	\N	15 Hillside Ln	Hillside Ln	15	[[121.07521677282185, 14.620012652235754], [121.07512889688492, 14.620053218124081], [121.07518826345299, 14.620195685464546], [121.0752892201592, 14.620149927171635]]	14.62010287	121.07520579	192.47	2026-02-24 20:40:43.954774	2026-02-24 20:40:43.954774
104	\N	20 Moonlight Loop	Moonlight Loop	20	[[121.07495281845333, 14.619384948620956], [121.07519052922727, 14.61928502687765], [121.07528306543828, 14.619485519160865], [121.07511073350908, 14.619536777676386], [121.07498534023762, 14.619458916635427]]	14.61943024	121.07510450	0.05	2025-12-10 07:57:31.972138	2026-02-24 20:07:10.535856
127	\N	2 Starline Rd	Starline Rd	2	[[121.07741340994838, 14.618693606018237], [121.07756629586221, 14.618617366789946], [121.07743889093402, 14.618368210318902], [121.07727326452734, 14.618455804422968]]	14.61853375	121.07742297	0.05	2025-12-10 19:50:05.993312	2026-02-24 20:12:33.752384
110	\N	19 Starline Rd	Starline Rd	19	[[121.07612192630769, 14.618640400772343], [121.07622351497412, 14.618615420256118], [121.0762966051698, 14.618900587279073], [121.07619635760786, 14.618920701435087]]	14.61876928	121.07620960	0.03	2025-12-10 08:04:50.408389	2026-02-24 20:13:38.154632
111	\N	34 Starline Rd	Starline Rd	34	[[121.07534341514112, 14.619573112819387], [121.07544768601659, 14.619789825868859], [121.07560191303494, 14.619687957785407], [121.07544198632242, 14.619485519160865]]	14.61963410	121.07545875	0.04	2025-12-10 08:07:29.476583	2026-02-24 20:17:15.953329
108	\N	7 Promenade Ln	Promenade Ln	7	[[121.07615377753976, 14.618482082647384], [121.07618965208532, 14.618622881969051], [121.07643708586693, 14.618559295189796], [121.07640322297813, 14.618417846982164]]	14.61852053	121.07629593	0.04	2025-12-10 08:03:08.755409	2026-02-24 15:35:06.335136
107	\N	5 Promenade Ln	Promenade Ln	5	[[121.07610683888198, 14.618321817871859], [121.07615310698749, 14.618481109379866], [121.07640121132137, 14.618418495827354], [121.07635226100686, 14.618261475233775]]	14.61837072	121.07625335	0.04	2025-12-10 08:01:32.697109	2026-02-24 15:35:26.661544
109	\N	9 Promenade Ln	Promenade Ln	9	[[121.07622485607862, 14.618614771411501], [121.07629694044591, 14.618900262857192], [121.07642602175476, 14.618778604616038], [121.0764230042696, 14.618564161525592]]	14.61871445	121.07634271	0.04	2025-12-10 08:03:57.430358	2026-02-24 15:38:38.061899
128	\N	29 Riverview Dr	Riverview Dr	29	[[121.0771803930402, 14.618202754693703], [121.07725616544487, 14.61835490898894], [121.07741173356773, 14.618280940602713], [121.07737988233568, 14.618166743747008]]	14.61825134	121.07730704	0.03	2025-12-10 19:53:50.475094	2026-02-24 18:29:44.618617
112	\N	32 Starline Rd	Starline Rd	32	[[121.07560325413944, 14.619684713578145], [121.0757175832987, 14.619617234056363], [121.07551205903295, 14.619356723977301], [121.07542589306833, 14.619461836424968]]	14.61953013	121.07556470	0.04	2025-12-10 08:09:26.48753	2026-02-24 20:17:20.275996
113	\N	30 Starline Rd	Starline Rd	30	[[121.07570920139553, 14.619603608381196], [121.07581648975612, 14.61954586146269], [121.07556469738486, 14.619217547233099], [121.07551440596583, 14.619346666919485]]	14.61942842	121.07565120	0.04	2025-12-10 08:10:06.64989	2026-02-24 20:17:25.225528
114	\N	28 Starline Rd	Starline Rd	28	[[121.07581917196515, 14.619541968411458], [121.07591841369869, 14.619483897055739], [121.0756726562977, 14.619133846491309], [121.07557576149703, 14.619228901982416]]	14.61934715	121.07574650	0.05	2025-12-10 08:11:40.347066	2026-02-24 20:17:34.177716
115	\N	26 Starline Rd	Starline Rd	26	[[121.07592344284059, 14.619482274950613], [121.07606895267963, 14.619399871994302], [121.07579670846464, 14.6190715575465], [121.07569009065631, 14.619151365253865]]	14.61927627	121.07586980	0.06	2025-12-10 08:21:39.368269	2026-02-24 20:17:39.033123
116	\N	24 Starline Rd	Starline Rd	24	[[121.07605352997781, 14.619373269458508], [121.07613533735277, 14.619322010904822], [121.0759261250496, 14.619019650078986], [121.0758174955845, 14.619091996108468]]	14.61920173	121.07598312	0.04	2025-12-10 08:24:13.864263	2026-02-24 20:17:56.319161
117	\N	22 Starline Rd	Starline Rd	22	[[121.07593517750503, 14.6190267873565], [121.07615377753976, 14.619347315761939], [121.07625268399717, 14.619277240765875], [121.0760682821274, 14.619006673210194]]	14.61916450	121.07610248	0.04	2025-12-10 11:50:52.878426	2026-02-24 20:18:05.22025
118	\N	20 Starline Rd	Starline Rd	20	[[121.07620507478715, 14.61897812409616], [121.07636734843254, 14.619214303018877], [121.07625804841518, 14.619283729192384], [121.0760696232319, 14.61900342899288]]	14.61911990	121.07622502	0.04	2025-12-10 11:51:31.234898	2026-02-24 20:18:13.330124
119	\N	18 Starline Rd	Starline Rd	18	[[121.07620876282455, 14.61897682640906], [121.07638310641052, 14.619232146196408], [121.07650011777879, 14.619163044428117], [121.07636231929065, 14.618939193480124]]	14.61907780	121.07636358	0.04	2025-12-10 11:54:57.311075	2026-02-24 20:18:52.539213
120	\N	16 Starline Rd	Starline Rd	16	[[121.07637070119382, 14.618934651574465], [121.0765202343464, 14.618828241186566], [121.0766811668873, 14.619044954970937], [121.07649408280851, 14.619142930294279]]	14.61898769	121.07651655	0.05	2025-12-10 11:55:40.009626	2026-02-24 20:19:00.202262
121	\N	14 Starline Rd	Starline Rd	14	[[121.07651922851802, 14.618822401590604], [121.07668418437244, 14.619042359597543], [121.07682902365924, 14.618961254163398], [121.0766637325287, 14.6187438914522]]	14.61889248	121.07667404	0.04	2025-12-10 11:59:04.241704	2026-02-24 20:19:04.833687
122	\N	12 Starline Rd	Starline Rd	12	[[121.07666574418546, 14.618742918185852], [121.07683002948762, 14.618960929741593], [121.07692759484054, 14.61891096877918], [121.076786108315, 14.618672194152543]]	14.61882175	121.07680237	0.03	2025-12-10 17:02:20.681975	2026-02-24 20:19:10.698733
123	\N	10 Starline Rd	Starline Rd	10	[[121.07692994177343, 14.61890999551357], [121.07704360038043, 14.618849653037056], [121.0769021138549, 14.618610553921453], [121.07678242027762, 14.618664083596812]]	14.61875857	121.07691452	0.04	2025-12-10 19:46:43.426948	2026-02-24 20:19:25.525616
124	\N	8 Starline Rd	Starline Rd	8	[[121.07704628258945, 14.618848679771167], [121.07716497033836, 14.618800665315433], [121.07702013105155, 14.618551833474687], [121.07690177857877, 14.61860698527596]]	14.61870204	121.07703329	0.04	2025-12-10 19:47:17.214231	2026-02-24 20:20:45.859374
125	\N	6 Starline Rd	Starline Rd	6	[[121.0771679878235, 14.618799692049327], [121.07729438692334, 14.618745513562784], [121.07714921236041, 14.618489544364833], [121.07702046632768, 14.618549886940286]]	14.61864616	121.07715801	0.04	2025-12-10 19:48:44.462386	2026-02-24 20:20:51.079935
126	\N	4 Starline Rd	Starline Rd	4	[[121.07729069888593, 14.618736105321252], [121.07740167528394, 14.618682251241237], [121.07725985348227, 14.618436014646957], [121.07715021818879, 14.618487922252367]]	14.61858557	121.07727561	0.03	2025-12-10 19:49:20.697115	2026-02-24 20:20:55.279804
146	\N	1 Comets Loop	Comets Loop	1	[[121.07391715049745, 14.616571550212651], [121.0741236805916, 14.616472276040609], [121.07403114438058, 14.616269185601178], [121.07381120324136, 14.616366513311235]]	14.61641988	121.07397079	0.05	2025-12-10 20:51:27.655019	2026-02-24 19:41:21.95505
147	\N	3 Comets Loop	Comets Loop	3	[[121.07380650937559, 14.616368459864987], [121.07362478971483, 14.616488497313616], [121.0738118737936, 14.616642923772678], [121.07390977442266, 14.61656700825805]]	14.61651672	121.07378824	0.04	2025-12-10 20:55:07.536324	2026-02-24 19:43:08.902819
148	\N	5 Comets Loop	Comets Loop	5	[[121.07334248721602, 14.61660853469665], [121.0735584050417, 14.616446322001314], [121.07380583882333, 14.616644221473567], [121.07374012470247, 14.616761663371163]]	14.61661519	121.07361171	0.07	2025-12-10 20:55:59.085394	2026-02-24 19:43:13.76889
149	\N	7 Comets Loop	Comets Loop	7	[[121.07349067926408, 14.61667536629231], [121.07374347746374, 14.616767503021894], [121.07369653880599, 14.616877158656767], [121.07341289520265, 14.616873265558233]]	14.61679832	121.07358590	0.04	2025-12-10 21:05:07.136834	2026-02-24 19:43:19.937329
150	\N	9 Comets Loop	Comets Loop	9	[[121.0734122246504, 14.616879754055732], [121.07351481914522, 14.617108797894872], [121.07377164065839, 14.617001088923786], [121.07374481856824, 14.616876509807021]]	14.61696654	121.07361088	0.06	2025-12-10 21:36:57.716524	2026-02-24 19:43:35.92848
151	\N	11 Comets Loop	Comets Loop	11	[[121.07358053326608, 14.61723921651811], [121.07383802533151, 14.61712891221495], [121.07377432286741, 14.617003684321302], [121.0735134780407, 14.617111393291115]]	14.61712080	121.07367659	0.04	2025-12-10 21:37:25.808602	2026-02-24 19:47:21.188167
152	\N	13 Comets Loop	Comets Loop	13	[[121.07357047498228, 14.617244407307481], [121.07364289462569, 14.61738974936012], [121.07390239834787, 14.617270361252503], [121.07383601367475, 14.617131507610953]]	14.61725901	121.07373795	0.05	2025-12-10 21:38:07.770802	2026-02-24 19:47:25.377726
136	\N	6 Promenade Ln	Promenade Ln	6	[[121.07680924236777, 14.618058710871477], [121.07640959322454, 14.618139167792835], [121.07645116746427, 14.618298783856053], [121.07681192457677, 14.61822416660517]]	14.61818021	121.07662048	0.06	2025-12-10 20:03:29.554051	2025-12-10 20:03:29.554051
102	\N	18 Moonlight Loop	Moonlight Loop	18	[[121.07484117150308, 14.619143903558857], [121.07489917427303, 14.619261668541498], [121.0751197859645, 14.619163368849605], [121.07506882399323, 14.619040737489147]]	14.61915242	121.07498224	0.03	2025-12-10 07:53:19.424264	2026-02-24 20:43:20.13871
202	\N	23 Riverview Dr	Riverview Dr	23	[[121.07696218956727, 14.617803340335199], [121.07710238858118, 14.61778938552753], [121.07711678647918, 14.618074613483401], [121.07696820235677, 14.618070394593362]]	14.61793443	121.07703739	478.71	2026-02-24 20:53:41.037449	2026-02-24 20:53:41.037449
153	\N	15 Comets Loop	Comets Loop	15	[[121.07364423573017, 14.617391047056582], [121.07370592653753, 14.617517572425148], [121.07396408915523, 14.617407268261756], [121.07390306890012, 14.61727490319256]]	14.61739770	121.07380433	0.04	2025-12-10 21:38:48.17546	2026-02-24 19:48:11.891646
137	\N	7 Starline Rd	Starline Rd	7	[[121.07669793069364, 14.618252066971506], [121.07681863009932, 14.618223517759395], [121.07696481049064, 14.61849603281461], [121.07683338224889, 14.61854145195761]]	14.61837827	121.07682869	0.04	2025-12-10 20:04:27.849967	2026-02-24 20:22:00.488298
138	\N	5 Starline Rd	Starline Rd	5	[[121.0768209770322, 14.61821638045579], [121.07695810496809, 14.61815474009679], [121.07712037861347, 14.618435041379234], [121.07697285711767, 14.618503818954082]]	14.61832750	121.07696808	0.05	2025-12-10 20:06:08.819384	2026-02-24 20:22:06.524113
139	\N	3 Starline Rd	Starline Rd	3	[[121.0769306123257, 14.618100237028115], [121.07712607830764, 14.618434068111512], [121.07726119458677, 14.618370156854931], [121.07711970806123, 14.618097641643564]]	14.61825053	121.07710940	0.05	2025-12-10 20:06:45.174982	2026-02-24 20:22:10.663583
207	\N	16 Milkyway Dr	Milkyway Dr	16	[[121.07570562900595, 14.616920581131414], [121.07559427476524, 14.616851131335647], [121.0756781258501, 14.616623958953138], [121.07588339330592, 14.616847236953927]]	14.61681073	121.07571536	514.81	2026-02-24 21:02:22.03701	2026-02-24 21:02:22.03701
133	\N	19 Riverview Dr	Riverview Dr	19	[[121.07662953436376, 14.618085962412659], [121.07680723071101, 14.618056764332687], [121.07681125402452, 14.617812798001761], [121.07657521963122, 14.617841347267241]]	14.61794922	121.07670581	0.05	2025-12-10 19:59:46.99573	2026-02-24 18:22:20.272151
131	\N	23 Riverview Dr	Riverview Dr	23	[[121.07711032032968, 14.617961708334372], [121.07732826395576, 14.617946643701535], [121.07730077131335, 14.617780538911754], [121.07710698171202, 14.617788973923629]]	14.61786947	121.07721158	0.04	2025-12-10 19:57:24.257373	2026-02-24 18:27:54.972757
130	\N	25 Riverview Dr	Riverview Dr	25	[[121.07711099088192, 14.617963330450719], [121.07712440192701, 14.618093099720515], [121.07735909521581, 14.618054817793885], [121.07733495533466, 14.617951651212689]]	14.61801572	121.07723236	0.03	2025-12-10 19:56:15.404745	2026-02-24 18:28:49.981011
129	\N	27 Riverview Dr	Riverview Dr	27	[[121.07712842524053, 14.61810153472038], [121.0771780461073, 14.618196266235287], [121.0773725062609, 14.618159282018567], [121.07735842466356, 14.618061955102746]]	14.61812976	121.07725935	0.02	2025-12-10 19:54:30.649224	2026-02-24 18:29:30.711739
140	\N	36 Riverview Dr	Riverview Dr	36	[[121.07760585844518, 14.618485002449901], [121.07767894864084, 14.618634236749129], [121.07804104685783, 14.618430499463157], [121.07799410820009, 14.618305921156988]]	14.61846391	121.07782999	0.06	2025-12-10 20:08:26.974963	2026-02-24 18:32:18.255839
142	\N	32 Riverview Dr	Riverview Dr	32	[[121.07755824923518, 14.618372752236263], [121.07782781124116, 14.61823909005737], [121.07778288424016, 14.618126190872033], [121.07748113572599, 14.618233250445748]]	14.61824282	121.07766252	0.04	2025-12-10 20:09:33.858136	2026-02-24 18:32:29.419608
143	\N	30 A Riverview Dr	Riverview Dr	30	[[121.07749454677108, 14.61821962468473], [121.0777694731951, 14.618120351257408], [121.07772253453733, 14.617989933157283], [121.0774623602629, 14.618061955102746]]	14.61809797	121.07761223	0.04	2025-12-10 20:10:01.891282	2026-02-24 18:32:46.811433
144	\N	30 B Riverview Dr	Riverview Dr	30	[[121.07771515846254, 14.617981498153117], [121.07766486704351, 14.617827721481898], [121.07741340994838, 14.617835507645058], [121.07744961977008, 14.618052222408785]]	14.61792424	121.07756076	0.05	2025-12-10 20:10:23.736033	2026-02-24 18:34:13.329677
141	\N	34 A Riverview Dr	Riverview Dr	34	[[121.07760854065418, 14.618480460534855], [121.07788078486922, 14.618353286875468], [121.07783250510694, 14.61824168544027], [121.07755690813066, 14.618378591844172]]	14.61836351	121.07771968	0.04	2025-12-10 20:09:08.362389	2026-02-24 18:37:01.081556
199	\N	2 Evening Glow Rd	Evening Glow Rd	2	[[121.07635668395926, 14.617936671087127], [121.07658408810144, 14.617888640611753], [121.076557926563, 14.617754285036979], [121.07638418711508, 14.617810753332034]]	14.61784759	121.07647072	312.57	2026-02-24 20:50:35.61376	2026-02-24 20:50:35.61376
155	\N	Covered Court	Union Lane	1	[[121.07387959957124, 14.6178102026138], [121.07402443885805, 14.618169663553722], [121.07443079352379, 14.618043787407025], [121.0743221640587, 14.617754401765332], [121.07415318489076, 14.617701196291964]]	14.61789585	121.07416204	0.17	2025-12-10 21:40:27.871677	2025-12-10 21:40:27.871677
203	\N	3 Riverview Dr	Riverview Dr	3	[[121.07584097927321, 14.616804346158306], [121.07611802325765, 14.616764753265839], [121.07611536566547, 14.616634751036251], [121.0760264835155, 14.616645460596171], [121.07589601122741, 14.6166590909444], [121.07576694748371, 14.616660392707189]]	14.61669480	121.07596064	510.43	2026-02-24 20:55:31.662924	2026-02-24 20:55:31.662924
158	\N	Barangay Hall	Moonlight Loop	1	[[121.07402510941029, 14.618172907783338], [121.07417665421963, 14.618534314664322], [121.0744720324874, 14.61846261729627], [121.07484921813014, 14.618217029301578], [121.0747600346804, 14.617953597752408]]	14.61826809	121.07445661	0.27	2025-12-10 21:48:04.514575	2025-12-10 21:48:04.514575
205	\N	12 Milkyway Dr	Milkyway Dr	12	[[121.07521804110158, 14.616713520827151], [121.07540720914906, 14.61668690920067], [121.07541391723584, 14.61680179351626], [121.07526969336988, 14.616818669173382]]	14.61675522	121.07532722	227.52	2026-02-24 20:56:59.425464	2026-02-24 20:56:59.425464
209	\N	19 Milkyway Dr	Milkyway Dr	19	[[121.07542668285836, 14.617065276686965], [121.07563932920961, 14.617034770724704], [121.07558968936736, 14.616913395896747], [121.07540588778932, 14.616862768943333]]	14.61696905	121.07551540	380.67	2026-02-24 23:33:30.836079	2026-02-24 23:33:30.836079
211	\N	8 Promenade Ln	Promenade Ln	8	[[121.07646673453358, 14.618469964638072], [121.076760548735, 14.618390779446349], [121.07669480948448, 14.61825123170295], [121.0764211195434, 14.618299911158395]]	14.61835297	121.07658580	569.39	2026-02-24 23:36:59.66348	2026-02-24 23:36:59.66348
164	\N	16 Moonlight Loop	Moonlight Loop	16	[[121.07476808130743, 14.619244149787747], [121.07482708990575, 14.619351208816617], [121.07457965612413, 14.619466702740764], [121.07451863586903, 14.619347315761939]]	14.61935234	121.07467337	0.03	2025-12-10 21:54:07.812135	2025-12-10 21:54:07.812135
165	\N	17 Moonlight Loop	Moonlight Loop	17	[[121.07458166778089, 14.619468649267061], [121.07468761503698, 14.619637996988358], [121.07490219175817, 14.619462160846023], [121.07483513653281, 14.619349262289278]]	14.61947952	121.07475165	0.05	2025-12-10 21:54:45.106512	2025-12-10 21:54:45.106512
213	\N	11 Starline Rd	Starline Rd	11	[[121.07670636259972, 14.618610528587661], [121.07683649948348, 14.618551464263813], [121.07676136891143, 14.618390822203882], [121.07662989041036, 14.61842749403801]]	14.61849508	121.07673353	313.04	2026-02-24 23:39:13.601387	2026-02-24 23:39:13.601387
215	\N	24 Twin Peaks Dr	Twin Peaks Dr	24	[[121.07520807000238, 14.618085236389069], [121.075493163691, 14.618052134328183], [121.07549115126494, 14.618217644582678], [121.07522081536726, 14.618231923892928]]	14.61814673	121.07535330	521.35	2026-02-24 23:46:17.390203	2026-02-24 23:46:17.390203
217	\N	28 Twin Peaks Dr	Twin Peaks Dr	28	[[121.07522740088277, 14.61837496226546], [121.07550947593232, 14.618356788609546], [121.07554104996858, 14.61848495563043], [121.07525260223657, 14.618521302919511]]	14.61843450	121.07538263	478.77	2026-02-24 23:48:03.808062	2026-02-24 23:48:03.808062
219	\N	32 Twin Peaks Dr	Twin Peaks Dr	32	[[121.07557311839376, 14.61861008615958], [121.07561470089675, 14.618736851654807], [121.0753457559985, 14.618838004631758], [121.0752988080113, 14.618680115189008]]	14.61871626	121.07545810	509.01	2026-02-24 23:49:01.73949	2026-02-24 23:49:01.73949
154	\N	17 Comets Loop	Comets Loop	17	[[121.07368245720865, 14.61753379362097], [121.0737515240908, 14.617660318907339], [121.07400834560396, 14.617548717120089], [121.07394799590114, 14.617418298680585]]	14.61754028	121.07384758	0.04	2025-12-10 21:39:31.735917	2026-02-24 19:48:17.74475
221	\N	13 Moonlight Loop	Moonlight Loop	13	[[121.0743617532768, 14.618932822629917], [121.07447308174397, 14.61920663577368], [121.0747353197869, 14.619095756732547], [121.07458911034094, 14.618845468164947]]	14.61902017	121.07453982	922.26	2026-02-24 23:56:01.487115	2026-02-24 23:56:01.487115
223	\N	12 Moonlight Loop	Moonlight Loop	12	[[121.0748391648904, 14.618727816580671], [121.07488811961338, 14.61883150186858], [121.07471172931851, 14.618913526526448], [121.07465712575718, 14.618812112445195]]	14.61882124	121.07477403	272.01	2026-02-24 23:57:50.799348	2026-02-24 23:57:50.799348
225	\N	21 Comets Loop	Comets Loop	21	[[121.07479222023515, 14.617956111041577], [121.07490020060577, 14.617929525862083], [121.0748458750777, 14.617747968452697], [121.07473051716623, 14.617805677788382]]	14.61785982	121.07481720	251.59	2026-02-25 00:01:17.570161	2026-02-25 00:01:17.570161
169	\N	19 Comets Loop	Comets Loop	19	[[121.07401303946973, 14.617548068272317], [121.07407473027708, 14.617681082024289], [121.07382327318193, 14.61780436299079], [121.07375621795656, 14.617662265449626]]	14.61767394	121.07391682	0.04	2025-12-10 22:01:04.299849	2026-02-24 19:48:44.722074
157	\N	7 Moonlight Loop	Moonlight Loop	7	[[121.07447303831579, 14.618466185944092], [121.07418000698091, 14.618534314664322], [121.0742396861315, 14.618666678974673], [121.07450120151044, 14.61858038264414]]	14.61856189	121.07434848	0.04	2025-12-10 21:46:45.346107	2026-02-24 20:08:39.981824
159	\N	9 Moonlight Loop	Moonlight Loop	9	[[121.07423197478057, 14.618672194152543], [121.07429668307307, 14.618808775866125], [121.07455115765335, 14.618714693459694], [121.07450254261497, 14.618581680333566]]	14.61869434	121.07439559	0.04	2025-12-10 21:49:06.459904	2026-02-24 20:08:46.035539
160	\N	11 Moonlight Loop	Moonlight Loop	11	[[121.07429701834918, 14.618810073554203], [121.07436038553716, 14.618930758512407], [121.07458166778089, 14.618848355349208], [121.07453405857088, 14.618722479591417]]	14.61882792	121.07444328	0.03	2025-12-10 21:49:39.181848	2026-02-24 20:08:52.726182
163	\N	21 Moonlight Loop	Moonlight Loop	21	[[121.07446029782297, 14.619216898390249], [121.07451461255552, 14.619347315761939], [121.07479020953181, 14.61923182177502], [121.07473656535151, 14.619101404334758]]	14.61922436	121.07462542	0.04	2025-12-10 21:53:38.566267	2026-02-24 20:09:19.204473
166	\N	23 Moonlight Loop	Moonlight Loop	23	[[121.07467621564867, 14.619645134245783], [121.07478484511375, 14.619839786631392], [121.07499137520792, 14.619538075360163], [121.07490621507169, 14.619463458530246]]	14.61962161	121.07483966	0.05	2025-12-10 21:56:43.990387	2026-02-24 20:09:44.125325
167	\N	25 Moonlight Loop	Moonlight Loop	25	[[121.07511542737485, 14.619580898920665], [121.07504099607469, 14.619933868555918], [121.0748599469662, 14.62001302710949], [121.07478953897954, 14.619857305337627], [121.07500713318586, 14.61955105219757]]	14.61978723	121.07496261	0.08	2025-12-10 21:58:31.166349	2026-02-24 20:09:47.732507
200	\N	4 Promenade Ln	Promenade Ln	4	[[121.07662524847069, 14.618091454516025], [121.0765829875239, 14.617892517551274], [121.07634292032934, 14.61794251380656], [121.0763902123412, 14.618138205426986]]	14.61801617	121.07648534	588.02	2026-02-24 20:51:10.217639	2026-02-24 20:51:10.217639
204	\N	5 Riverview Dr	Riverview Dr	5	[[121.07614484009108, 14.616885871949783], [121.07612136178732, 14.616766119699202], [121.07587618121515, 14.616801493677025], [121.07589429304944, 14.616851471580954], [121.07593018131377, 14.6169426649997]]	14.61684952	121.07599337	381.94	2026-02-24 20:55:57.795755	2026-02-24 20:55:57.795755
37	\N	1 Milkyway Dr	Milkyway Dr	1	[[121.07501283288003, 14.61757986181059], [121.0751724243164, 14.617363795429194], [121.07537358999254, 14.61749032081346], [121.07519991695884, 14.617620090362648], [121.07507653534412, 14.617683677413778]]	14.61754755	121.07516706	0.06	2025-12-08 15:05:36.652016	2026-02-24 20:58:40.760087
89	\N	3 Evening Glow Rd	Evening Glow Rd	3	[[121.07626073062421, 14.617800469908694], [121.07612460851671, 14.617905258677686], [121.07604146003725, 14.617771920637885], [121.07602871954442, 14.617660967754768], [121.0760920867324, 14.617616846124852]]	14.61775109	121.07610952	0.03	2025-12-09 19:58:14.943314	2026-02-24 15:30:23.85524
206	\N	1 Milkyway Ln	Milkyway Ln	1	[[121.07521872396225, 14.616707107150955], [121.07541057524445, 14.616678548331343], [121.07540789200974, 14.616595468107718], [121.07517445058942, 14.616624676002399]]	14.61665145	121.07530291	219.15	2026-02-24 20:59:42.059989	2026-02-24 20:59:42.059989
208	\N	22 Milkyway Dr	Milkyway Dr	22	[[121.07578332447244, 14.617180739637737], [121.07599966027145, 14.61719793979707], [121.07601676589276, 14.617339435396072], [121.0757668896598, 14.617346899610931]]	14.61726625	121.07589166	429.96	2026-02-24 23:32:04.573546	2026-02-24 23:32:04.573546
210	\N	21 Milkyway Dr	Milkyway Dr	21	[[121.07564087276194, 14.617036377882698], [121.07566133242665, 14.617154182797801], [121.07543761773216, 14.61717754905445], [121.0754248723673, 14.617067532907699]]	14.61710891	121.07554117	305.73	2026-02-24 23:34:02.642678	2026-02-24 23:34:02.642678
106	\N	3 Promenade Ln	Promenade Ln	3	[[121.0760655999184, 14.618190751045457], [121.07611019164325, 14.618321817871859], [121.07636902481319, 14.618255311199924], [121.07633013278247, 14.61812164894957]]	14.61822238	121.07621874	0.04	2025-12-10 08:00:48.404774	2026-02-24 15:34:43.003627
212	\N	10 Promenade Ln	Promenade Ln	10	[[121.0764685920787, 14.618471647359442], [121.07662857994866, 14.618429134002179], [121.07670438132939, 14.618612493079663], [121.076544585522, 14.618673165281342]]	14.61854661	121.07658653	415.91	2026-02-24 23:38:43.768337	2026-02-24 23:38:43.768337
32	\N	6 Evening Glow Rd	Evening Glow Rd	6	[[121.07578396797182, 14.617780680073652], [121.07603810727598, 14.617775489296939], [121.07604146003725, 14.617946460440024], [121.07578732073308, 14.617952948905831]]	14.61786389	121.07591271	0.04	2025-12-08 13:57:37.264487	2026-02-24 18:07:39.168598
214	\N	14 Twin Peaks Dr	Twin Peaks Dr	14	[[121.07483642686509, 14.61727923006116], [121.07496924698356, 14.617191606626475], [121.0751027379107, 14.617188361313397], [121.07510206710201, 14.617346732535147], [121.07497125940958, 14.617459020258451]]	14.61729299	121.07499635	551.82	2026-02-24 23:42:31.155718	2026-02-24 23:42:31.155718
216	\N	27 Twin Peaks Dr	Twin Peaks Dr	27	[[121.07549578743503, 14.61821889759264], [121.07550848382269, 14.618354875103604], [121.0752257524525, 14.618372402052207], [121.07522172760045, 14.618233503356636]]	14.61829492	121.07536294	460.41	2026-02-24 23:47:25.504207	2026-02-24 23:47:25.504207
218	\N	30 Twin Peaks Dr	Twin Peaks Dr	30	[[121.07525425694926, 14.618523558590837], [121.07554136306389, 14.618487535831498], [121.07557255566749, 14.618607936202142], [121.07529819491775, 14.618677709971626]]	14.61857419	121.07541659	485.94	2026-02-24 23:48:29.932138	2026-02-24 23:48:29.932138
220	\N	34 Twin Peaks Dr	Twin Peaks Dr	34	[[121.0756592852258, 14.61884419409138], [121.07561501998072, 14.618738177992329], [121.07534711136489, 14.618838691317851], [121.075428599657, 14.61898134287243]]	14.61885060	121.07551250	461.27	2026-02-24 23:49:28.59562	2026-02-24 23:49:28.59562
222	\N	10 Moonlight Loop	Moonlight Loop	10	[[121.07458435817628, 14.618639137290279], [121.07480065426029, 14.618597314392582], [121.07482920416611, 14.618729110848532], [121.07463738810404, 14.618821185999385]]	14.61869669	121.07471290	416.71	2026-02-24 23:57:25.503554	2026-02-24 23:57:25.503554
22	\N	1 Riverview Dr	Riverview Dr	1	[[121.07589427381754, 14.616465463105591], [121.0758996382356, 14.616654603080299], [121.07607901096345, 14.616638381819554], [121.07606425881387, 14.616488497313616]]	14.61656174	121.07598430	0.03	2025-12-08 13:32:04.389479	2026-02-24 18:15:26.255349
224	\N	17 Twin Peaks Dr	Twin Peaks Dr	17	[[121.07490558408254, 14.617930245260933], [121.07510142425782, 14.61788096540765], [121.07505917106933, 14.617772679375463], [121.07487540323362, 14.617839466575271]]	14.61785584	121.07498540	251.74	2026-02-25 00:00:20.372013	2026-02-25 00:00:20.372013
226	\N	23 Comets Loop	Comets Loop	23	[[121.07487603486867, 14.617837319495182], [121.07505711996228, 14.617766641777568], [121.07495651713248, 14.617642793612026], [121.07484250059207, 14.617723197664628]]	14.61774249	121.07493304	271.27	2026-02-25 00:01:45.688429	2026-02-25 00:01:45.688429
62	\N	25 Starline Rd	Starline Rd	25	[[121.07566259801389, 14.618849653037056], [121.07574842870235, 14.619012512801245], [121.07595730572942, 14.61893302946528], [121.07587080448866, 14.618723452857854]]	14.61887966	121.07580978	0.05	2025-12-08 20:12:53.701078	2026-02-25 00:02:40.638984
105	\N	33 Starline Rd	Starline Rd	33	[[121.07519254088405, 14.61928502687765], [121.07528541237117, 14.619482923792674], [121.07541080564262, 14.619359643768203], [121.07545640319589, 14.619296381623506], [121.0753980651498, 14.619190620253743]]	14.61932292	121.07534865	0.04	2025-12-10 07:58:50.817007	2026-02-25 00:02:43.655694
227	\N	377 Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	377	[[121.07458305444604, 14.616401717182027], [121.0745951267856, 14.61656447143545], [121.07469170550216, 14.61655993247384], [121.07468969344559, 14.616395232946319]]	14.61648034	121.07463990	199.95	2026-02-25 00:07:40.463792	2026-02-25 00:07:40.463792
228	\N	377 B Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	377	[[121.07469503147456, 14.616393328724403], [121.07469838490223, 14.616570348291889], [121.07479496361874, 14.6165632156381], [121.07478222059369, 14.616392680300827]]	14.61647989	121.07474265	191.84	2026-02-25 00:08:19.665541	2026-02-25 00:08:19.665541
229	\N	379 Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	379	[[121.07485593137257, 14.616390645235713], [121.0748633089134, 14.616514494107122], [121.0747925515898, 14.616515466741964], [121.07478550939172, 14.616392590506479]]	14.61645330	121.07482433	104.55	2026-02-25 00:08:53.087635	2026-02-25 00:08:53.087635
230	\N	379 B Colonel Bonny Serrano Ave.	Colonel Bonny Serrano Ave.	379	[[121.07486061424291, 14.616528539110893], [121.074926341425, 14.616528539110893], [121.07492365868289, 14.616387507022598], [121.07485927287185, 14.616387507022598]]	14.61645802	121.07489247	110.02	2026-02-25 00:09:20.807178	2026-02-25 00:09:20.807178
\.


--
-- TOC entry 6234 (class 0 OID 44235)
-- Dependencies: 243
-- Data for Name: incident_report_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incident_report_evaluations (id, application_id, dss_status, evaluation_details, evaluated_at) FROM stdin;
1	14	Medium Priority	{"score": 5, "rule_id": "IR1", "max_score": 6, "rule_result": "high", "failed_rules": ["Location Validity Rule"], "passed_rules": ["Incident Severity Rule", "Timeliness Rule", "Completeness Rule", "Witness Credibility Rule", "Suspect Information Rule"], "rule_results": {"IR1": "high", "IR2": "moderate", "IR4": "incomplete", "IR5": "no_witnesses", "IR6": "no_suspect_info"}, "urgency_score": 54, "priority_level": "Medium Priority", "triggered_rule": "Incident Severity Rule", "recommendations": ["Incident location appears to be outside Barangay Blue Ridge B boundaries or is unclear. Please verify the exact location or provide specific landmarks to help responders."], "status_explanation": "Report needs attention within 24 hours. Urgency score: 54/100. Some follow-up actions required. Areas needing improvement: Location Validity Rule.", "failed_rules_details": {"IR3": "Location Validity Rule"}}	2026-02-04 19:46:24.359586
2	15	Medium Priority	{"score": 5, "rule_id": "IR1", "max_score": 6, "rule_result": "high", "failed_rules": ["Location Validity Rule"], "passed_rules": ["Incident Severity Rule", "Timeliness Rule", "Completeness Rule", "Witness Credibility Rule", "Suspect Information Rule"], "rule_results": {"IR1": "high", "IR2": "moderate", "IR4": "incomplete", "IR5": "no_witnesses", "IR6": "no_suspect_info"}, "urgency_score": 54, "priority_level": "Medium Priority", "triggered_rule": "Incident Severity Rule", "recommendations": ["Incident location appears to be outside Barangay Blue Ridge B boundaries or is unclear. Please verify the exact location or provide specific landmarks to help responders."], "status_explanation": "Report needs attention within 24 hours. Urgency score: 54/100. Some follow-up actions required. Areas needing improvement: Location Validity Rule.", "failed_rules_details": {"IR3": "Location Validity Rule"}}	2026-02-06 23:08:59.071936
\.


--
-- TOC entry 6236 (class 0 OID 44246)
-- Dependencies: 245
-- Data for Name: incident_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incident_reports (id, rp_full_name, rp_address, rp_contact, rp_relationship, vic_full_name, vic_address, vic_contact, vic_citizenship, vic_gender, vic_dob, vic_occupation, sus_full_name, sus_address, sus_contact, sus_gender, sus_description, incident_type, incident_timestamp, date_reported, description, witness_data_json, latitude, longitude, supabase_user_id, update_comments, resolution_details, updated_at, created_at, dss_status, status, approval_comments, disapproval_comments, application_date) FROM stdin;
1	Mateo, Ronnel Victor B.	none	+639474277177	\N	Mateo, Ronnel Victor B. (Same as RP)	none	+639474277177	\N	\N	\N	\N	Ronnel Mateo	none	+639474277177	Male	di ko mabanget eh sensya na	Theft	2025-11-02 02:17:00+08	2025-11-20 02:17:04+08	sana nmn umabot na ng singkwenta to para masubukan ko kung gumagana manlang oh knina pako narito at sinusubukan tong paganahin	[]	\N	\N	\N	\N	\N	2026-01-27 23:47:41.067178	2026-01-27 23:47:45.80103	Pending Evaluation	Pending	\N	\N	\N
2	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY TEST	\N	\N	\N	TEST THIS IS ONLY TEST	Serious Crime	2026-01-26 23:50:00+08	2026-01-27 15:50:20+08	TEST THIS IS ONLY TEST	[]	14.61712700	121.07334200	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-27 23:50:20.470638	2026-01-27 23:50:20.470638	Pending Evaluation	Pending	\N	\N	\N
3	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Minor Offenses Against Honor/Property	2026-01-25 23:55:00+08	2026-01-27 15:55:46+08	TEST THIS IS ONLY A TEST	[]	14.61742800	121.07354600	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-27 23:55:46.972721	2026-01-27 23:55:46.972721	Pending Evaluation	Pending	\N	\N	\N
4	Oliven, Jeferson  Putorez	3 Colonel Bonny Serrano Ave.	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Minor Offenses Against Persons/Safety	2026-01-27 00:12:00+08	2026-01-27 16:13:10+08	TEST THIS IS ONLY A TEST	[]	14.61708500	121.07335300	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-28 00:13:10.602906	2026-01-28 00:13:10.602906	Pending Evaluation	Pending	\N	\N	\N
5	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Property/Civil Disputes	2026-01-26 00:38:00+08	2026-01-27 16:38:24+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-28 00:38:24.153912	2026-01-28 00:38:24.153912	Pending Evaluation	Pending	\N	\N	\N
8	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Property/Civil Disputes	2026-01-26 01:10:00+08	2026-01-27 17:10:23+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	asdf	\N	2026-01-28 01:10:23.131376	2026-01-28 01:10:23.131376	Pending Evaluation	Closed	\N	\N	\N
7	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	THIS IS ONLY A TEST	3 Comets Loop	\N	Male	THIS IS ONLY A TEST	Minor Offenses Against Honor/Property	2026-01-19 00:48:00+08	2026-01-27 16:49:12+08	THIS IS ONLY A TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	Report is complete. Ready for processing.	Report is complete. Ready for processing.	2026-01-28 00:49:12.387616	2026-01-28 00:49:12.387616	Pending Evaluation	Resolved	\N	\N	\N
6	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Property/Civil Disputes	2026-01-26 00:38:00+08	2026-01-27 16:40:43+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	Report is complete.	\N	2026-01-28 00:40:43.992515	2026-01-28 00:40:43.992515	Pending Evaluation	Closed	\N	\N	\N
9	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Public Safety and Emergencies	2026-01-26 14:17:00+08	2026-01-28 06:17:36+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-28 14:17:36.966725	2026-01-28 14:17:36.966725	Pending Evaluation	Pending	\N	\N	2026-01-28
10	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Public Safety and Emergencies	2026-01-26 14:17:00+08	2026-01-28 06:46:26+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-28 14:46:26.352949	2026-01-28 14:46:26.352949	Pending Evaluation	Pending	\N	\N	2026-01-28
11	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Property/Civil Disputes	2026-01-19 14:49:00+08	2026-01-28 06:49:44+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-28 14:49:44.412113	2026-01-28 14:49:44.412113	Pending Evaluation	Pending	\N	\N	2026-01-28
12	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	\N	\N	\N	TEST THIS IS ONLY A TEST	Property/Civil Disputes	2026-01-19 14:49:00+08	2026-01-28 06:50:21+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-28 14:50:21.388166	2026-01-28 14:50:21.388166	Pending Evaluation	Pending	\N	\N	2026-01-28
13	Oliven, Jeferson  Putorez	3 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	TEST THIS IS ONLY A TEST	Serious Crime	2026-01-26 20:12:00+08	2026-01-28 12:13:02+08	TEST THIS IS ONLY A TEST	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-01-28 20:13:02.559826	2026-01-28 20:13:02.559826	Pending Evaluation	Pending	\N	\N	\N
14	Oliven, Jeferson  Putorez	5 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	Mateo Ravago Boctoy	5 Comets Loop	09785234512	Male	May tattoo sa shoulder left na star na may dragon	Serious Crime	2026-02-03 19:45:00+08	2026-02-04 11:46:24+08	Sinapak ni Ong si Boctoy, eh wala naman ginagawa si boctoy	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	\N	\N	2026-02-04 19:46:24.344054	2026-02-04 19:46:24.344054	Medium Priority	Pending	\N	\N	\N
15	Oliven, Jeferson  Putorez	5 Comets Loop	09123412341		\N		\N	\N	\N	\N	\N	Romeo Lurisoridad	8 Comets Loop	09782347567	Male	Tatto on left side of face, 5'1 his height, and brown skin	Violence Against Woman and their Children	2026-02-05 23:08:00+08	2026-02-06 15:08:59+08	He always punch her wife and wife's friend on their face	[]	\N	\N	db1d1ed3-3042-48ce-8b1e-b371402836f5	Requires further investigation.	\N	2026-02-06 23:08:59.059257	2026-02-06 23:08:59.059257	Medium Priority	Referred to Authorities	\N	\N	\N
\.


--
-- TOC entry 6238 (class 0 OID 44264)
-- Dependencies: 247
-- Data for Name: ocr_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ocr_jobs (id, job_type, payload, status, attempts, last_error, created_at, processed_at) FROM stdin;
1	application_files	{"files": ["1770194417_Emotional_Poetry_Collection_3.pdf"], "requirements": ["SEC"], "application_id": 61}	done	1	\N	2026-02-04 16:40:17.609132+08	2026-02-04 16:40:20.142887+08
2	application_files	{"files": ["1770194505_Emotional_Poetry_Collection_3.pdf"], "requirements": ["SEC"], "application_id": 62}	done	1	\N	2026-02-04 16:41:46.008401+08	2026-02-04 16:41:47.984924+08
3	application_files	{"files": ["1770196441_olyid.jpg"], "requirements": ["Lease Contract"], "application_id": 63}	done	1	\N	2026-02-04 17:14:01.465962+08	2026-02-04 17:16:09.436586+08
4	application_files	{"files": ["1770206637_valid_id_test.jpg"], "requirements": ["Previous Business Permit"], "application_id": 65}	done	1	\N	2026-02-04 20:03:57.549628+08	2026-02-04 20:08:00.756074+08
5	application_files	{"files": ["1770207480_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"], "requirements": ["SEC", "DTI", "TCT"], "application_id": 66}	done	1	\N	2026-02-04 20:18:00.727573+08	2026-02-04 21:41:48.696746+08
6	application_files	{"files": ["1770210690_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"], "requirements": ["Previous Business Permit"], "application_id": 67}	done	1	\N	2026-02-04 21:11:30.452663+08	2026-02-04 21:41:53.118887+08
7	application_files	{"files": ["1770212617_valid_id_test.jpg"], "requirements": ["SEC", "DTI", "TCT"], "application_id": 68}	done	1	\N	2026-02-04 21:43:37.107961+08	2026-02-04 21:43:41.270509+08
8	application_files	{"files": ["1770224419_valid_id_test.jpg"], "requirements": ["Previous Business Permit"], "application_id": 69}	done	1	\N	2026-02-05 01:00:19.388251+08	2026-02-05 01:00:23.597897+08
9	application_files	{"files": ["1770224497_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"], "requirements": ["Previous Business Permit"], "application_id": 70}	done	1	\N	2026-02-05 01:01:37.725648+08	2026-02-05 01:01:42.789143+08
10	application_files	{"files": ["1770228878_localhost_8080_Banwa_client_pages_staff_business_staff_business.php (1).png"], "requirements": ["Previous Business Permit"], "application_id": 71}	done	1	\N	2026-02-05 02:14:38.389102+08	2026-02-05 02:14:44.876338+08
11	application_files	{"files": ["1770228971_test_business_print.pdf"], "requirements": ["Previous Business Permit"], "application_id": 72}	done	1	\N	2026-02-05 02:16:11.144817+08	2026-02-05 02:16:15.913327+08
12	application_files	{"files": ["1770389202_valid_id_test.jpg"], "requirements": ["Previous Business Permit"], "application_id": 73}	pending	0	\N	2026-02-06 22:46:42.066521+08	\N
13	application_files	{"files": ["1771940375_localhost_8080_Banwa_client_pages_auth_suspended.php.png"], "requirements": ["DTI"], "application_id": 74}	pending	0	\N	2026-02-24 21:39:35.074652+08	\N
14	application_files	{"files": ["1771944309_localhost_8080_Banwa_client_pages_auth_suspended.php.png"], "requirements": [], "application_id": 75}	pending	0	\N	2026-02-24 22:45:09.290433+08	\N
15	application_files	{"files": ["1771944339_localhost_8080_Banwa_client_pages_auth_suspended.php.png"], "requirements": ["SEC", "DTI"], "application_id": 76}	pending	0	\N	2026-02-24 22:45:39.823188+08	\N
16	application_files	{"files": ["1771944628_Barangay-Blue-Ridge-B-Business-Clearance.pdf"], "requirements": ["SEC", "DTI"], "application_id": 77}	pending	0	\N	2026-02-24 22:50:28.663765+08	\N
17	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a4435d98949_applicationsTable_export (3).pdf", "filename": "applicationsTable_export (3).pdf", "saved_filename": "const_69a4435d98949_applicationsTable_export (3).pdf"}], "application_id": 29}	pending	0	\N	2026-03-01 21:47:09.679908+08	\N
18	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a450fd98880_applicationsTable_export (1).pdf", "filename": "applicationsTable_export (1).pdf", "saved_filename": "const_69a450fd98880_applicationsTable_export (1).pdf"}], "application_id": 30}	pending	0	\N	2026-03-01 22:45:17.73105+08	\N
19	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a7ff012b147_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a7ff012b147_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}], "application_id": 31}	pending	0	\N	2026-03-04 17:44:33.274393+08	\N
20	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a80463ac250_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a80463ac250_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}], "application_id": 32}	pending	0	\N	2026-03-04 18:07:31.750938+08	\N
21	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a813f714347_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a813f714347_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}], "application_id": 34}	pending	0	\N	2026-03-04 19:13:59.131768+08	\N
22	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a81535a3110_localhost_8080_Banwa_client_pages_resident_status.php (4).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (4).png", "saved_filename": "const_69a81535a3110_localhost_8080_Banwa_client_pages_resident_status.php (4).png"}], "application_id": 35}	pending	0	\N	2026-03-04 19:19:17.705407+08	\N
23	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a817290dcdb_localhost_8080_Banwa_client_pages_resident_status.php (1).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (1).png", "saved_filename": "const_69a817290dcdb_localhost_8080_Banwa_client_pages_resident_status.php (1).png"}], "application_id": 36}	pending	0	\N	2026-03-04 19:27:37.086121+08	\N
24	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a819d729160_localhost_8080_Banwa_client_pages_resident_status.php (1).png", "filename": "localhost_8080_Banwa_client_pages_resident_status.php (1).png", "saved_filename": "const_69a819d729160_localhost_8080_Banwa_client_pages_resident_status.php (1).png"}], "application_id": 37}	pending	0	\N	2026-03-04 19:39:03.202554+08	\N
25	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a8830381883_valid_id_3.jpg", "filename": "valid_id_3.jpg", "saved_filename": "const_69a8830381883_valid_id_3.jpg"}], "application_id": 38}	pending	0	\N	2026-03-05 03:07:47.55053+08	\N
26	construction_application_files	{"files": [{"file_url": "/server/handlers/staff/construction/uploads/const_69a8830381883_valid_id_3.jpg", "filename": "valid_id_3.jpg", "saved_filename": "const_69a8830381883_valid_id_3.jpg"}], "application_id": 38}	pending	0	\N	2026-03-05 03:08:38.69242+08	\N
\.


--
-- TOC entry 6240 (class 0 OID 44278)
-- Dependencies: 249
-- Data for Name: ocr_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ocr_verifications (id, supabase_user_id, email, meta, data, verified, reasons, created_at) FROM stdin;
\.


--
-- TOC entry 6242 (class 0 OID 44287)
-- Dependencies: 251
-- Data for Name: resident; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resident (resident_id, user_id, household_head_name, address, household_size, contact_no, household_status, registered_date, supabase_user_id, first_name, middle_name, last_name, suffix, ocr_verified) FROM stdin;
14	42	Jeferson Ismael Muring	30 82 POOK ALARIS UP CAMPUS, QUEZON CITY, NCR, SECOND DISTRICT	\N	09919926620	\N	2026-03-05 12:29:44.981688	a44e109d-622d-437d-bb0c-e7e32daafe4a	\N	\N	\N	\N	f
\.


--
-- TOC entry 6244 (class 0 OID 44296)
-- Dependencies: 253
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role (role_id, role_name, description) FROM stdin;
1	resident	\N
2	super_admin	\N
4	business_staff	\N
5	construction_staff	\N
6	utility_staff	\N
7	incident_report_staff	\N
8	finance_staff	\N
\.


--
-- TOC entry 6246 (class 0 OID 44303)
-- Dependencies: 255
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (filename, applied_at) FROM stdin;
20260204_add_business_application_files.sql	2026-02-04 16:35:40.119024+08
20260204_add_requirement_upload_json_business_files_ocr_jobs.sql	2026-02-04 16:36:12.804466+08
20260204_create_ocr_jobs_and_business_files.sql	2026-02-04 16:36:12.808129+08
\.


--
-- TOC entry 5889 (class 0 OID 43322)
-- Dependencies: 221
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 6247 (class 0 OID 44310)
-- Dependencies: 256
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, password, email, full_name, role_id, created_at, supabase_user_id, first_name, middle_name, last_name, suffix, is_archived, status, suspend_reason, reason_details, suspended_until, latitude, longitude, lot_no, street, ocr_verified) FROM stdin;
34	\N	\N	jefersonmuring61@gmail.com	Anderson Surville	4	2026-02-27 00:55:46.451834	59eed2b7-fc23-4cc1-b3ca-de75fbcc8eae	\N	\N	\N	\N	f	active	Violation of Terms of Service	User submitted content that violates platform guidelines.	2026-03-06 14:09:40+08	14.61650000	121.07569000	5	Colonel Bonny Serrano Ave.	\N
8	\N	\N	leeparado123@gmail.com	Ronnel  Mateo	6	2025-12-15 15:37:28.014637	eb085d10-b018-42d4-ae19-e937970c5f8a	\N	\N	\N	\N	f	active	\N	\N	\N	14.61649300	121.07552700	2	Crest line St	\N
6	\N	\N	mateo.ronnelvictor.bronio@gmail.com	Ronnel  Boctoy	7	2025-12-15 02:54:32.625651	35e0b48c-882b-4182-8c51-de3e960c79dd	\N	\N	\N	\N	f	active	\N	\N	\N	14.61650000	121.07569000	5	Colonel Bonny Serrano Ave.	\N
7	\N	\N	rvmateo71@gmail.com	Ronnel  Boctoy	5	2025-12-15 03:00:05.983603	d8b70153-d844-42dd-b409-7a0c68b6f52e	\N	\N	\N	\N	f	active	Suspicious or Unusual Activity	User displayed behavior inconsistent with normal activity.	2026-03-05 14:24:45+08	14.61649300	121.07552700	7	Milkyway Dr	\N
35	\N	\N	juanitomahusay35@gmail.com	Juanito Mahusay	5	2026-03-04 18:42:45.935548	6c69b931-eaf1-44e4-bceb-bb863433b8c9	\N	\N	\N	\N	f	active	\N	\N	\N	\N	\N	5	\N	\N
39	\N	\N	ravagolancealdwin1@gmail.com	Lance Ravago	8	2026-03-04 21:13:22.021089	7a77ee74-77ce-49a3-9b1e-14650252286c	\N	\N	\N	\N	f	active	\N	\N	\N	\N	\N	\N	\N	\N
40	\N	\N	luvien1722@gmail.com	\N	8	2026-03-04 21:23:19.288118	171e2b36-4d53-425b-bf6f-ea6bcb0db786	\N	\N	\N	\N	f	active	\N	\N	\N	\N	\N	\N	\N	\N
9	\N	\N	jeffmuring12@gmail.com	Jeferson Muring	2	2026-01-13 01:53:00.519038	08c4118e-1f53-4705-8246-23f301a1005b	\N	\N	\N	\N	f	active	\N	\N	\N	\N	\N		\N	\N
42	\N	\N	muring.jeferson.ismael@gmail.com	Jeferson Ismael Muring	1	2026-03-05 12:29:44.981688	a44e109d-622d-437d-bb0c-e7e32daafe4a	\N	\N	\N	\N	f	active	Violation of Terms of Service	User submitted content that violates platform guidelines.	2026-03-12 04:45:36+08	14.61714100	121.07482500	5	Twin Peaks Dr	\N
\.


--
-- TOC entry 6249 (class 0 OID 44322)
-- Dependencies: 258
-- Data for Name: utility_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_applications (id, address_of_utility, first_name, middle_name, last_name, suffix, owner_contact_no, owner_address, status, approval_comments, disapproval_reason, created_at, updated_at, supabase_user_id, latitude, longitude, date_of_work, request_date, nature_of_work, provider, agreed, application_date, dss_status) FROM stdin;
21	5 Comets Loop	Jeferson	Ismael	Muring		09132456778	30 82 POOK ALARIS UP CAMPUS, QUEZON CITY, NCR, SECOND DISTRICT	Approved	Application is complete. Ready for processing.	\N	2026-03-05 03:02:45.309387	2026-03-05 03:02:45.309387	d1b6349d-f242-458e-b576-42fb8bbe0f5d	14.61714000	121.07408800	2026-03-12	2026-03-05	New Installation	Globe	1	2026-03-05	Pre-Approved
22	5 Comets Loop	Jeferson	Ismael	Muring		09919926620	30 82 POOK ALARIS UP CAMPUS, QUEZON CITY, NCR, SECOND DISTRICT	Approved	Application is complete.	\N	2026-03-05 12:39:54.179234	2026-03-05 12:39:54.179234	a44e109d-622d-437d-bb0c-e7e32daafe4a	14.61714000	121.07408800	2026-03-07	2026-03-05	New Installation	Globe	1	2026-03-05	Pre-Approved
\.


--
-- TOC entry 6251 (class 0 OID 44338)
-- Dependencies: 260
-- Data for Name: utility_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_evaluations (id, application_id, dss_status, evaluation_details, evaluated_at) FROM stdin;
11	21	Pre-Approved	{"score": 4, "rule_id": "R1", "max_score": 4, "failed_rules": [], "passed_rules": ["Valid Utility Location Rule", "Provider Compliance Rule", "Work Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Utility Location Rule", "failed_critical": [], "passed_critical": ["R1", "R2"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-03-05 03:02:45.335707
12	22	Pre-Approved	{"score": 4, "rule_id": "R1", "max_score": 4, "failed_rules": [], "passed_rules": ["Valid Utility Location Rule", "Provider Compliance Rule", "Work Safety Rule", "Valid Contact Information Rule"], "triggered_rule": "Valid Utility Location Rule", "failed_critical": [], "passed_critical": ["R1", "R2"], "recommendations": [], "status_explanation": "Application meets all requirements for approval. All critical rules passed with sufficient overall score.", "approval_probability": 100, "failed_rules_details": []}	2026-03-05 12:39:54.197731
\.


--
-- TOC entry 6253 (class 0 OID 44349)
-- Dependencies: 262
-- Data for Name: utility_ocr_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_ocr_results (id, application_id, filename, saved_filename, file_url, ocr_result, created_at) FROM stdin;
\.


--
-- TOC entry 6255 (class 0 OID 44361)
-- Dependencies: 264
-- Data for Name: violation_report; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.violation_report (violation_id, reported_by, violator_name, address, regulation, specific_violation, fine_penalty, other_details, noted_by, date_reported, violation_status, attached_proof_image) FROM stdin;
\.


--
-- TOC entry 6297 (class 0 OID 0)
-- Dependencies: 226
-- Name: archives_archive_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.archives_archive_id_seq', 63, true);


--
-- TOC entry 6298 (class 0 OID 0)
-- Dependencies: 228
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 252, true);


--
-- TOC entry 6299 (class 0 OID 0)
-- Dependencies: 273
-- Name: barangay_boundaries_boundary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.barangay_boundaries_boundary_id_seq', 2, true);


--
-- TOC entry 6300 (class 0 OID 0)
-- Dependencies: 269
-- Name: barangay_hazards_hazard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.barangay_hazards_hazard_id_seq', 8, true);


--
-- TOC entry 6301 (class 0 OID 0)
-- Dependencies: 230
-- Name: business_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_applications_id_seq', 107, true);


--
-- TOC entry 6302 (class 0 OID 0)
-- Dependencies: 232
-- Name: business_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_evaluations_id_seq', 129, true);


--
-- TOC entry 6303 (class 0 OID 0)
-- Dependencies: 234
-- Name: business_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_files_id_seq', 47, true);


--
-- TOC entry 6304 (class 0 OID 0)
-- Dependencies: 236
-- Name: business_ocr_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_ocr_results_id_seq', 109, true);


--
-- TOC entry 6305 (class 0 OID 0)
-- Dependencies: 238
-- Name: construction_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.construction_applications_id_seq', 38, true);


--
-- TOC entry 6306 (class 0 OID 0)
-- Dependencies: 240
-- Name: construction_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.construction_evaluations_id_seq', 20, true);


--
-- TOC entry 6307 (class 0 OID 0)
-- Dependencies: 242
-- Name: construction_ocr_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.construction_ocr_results_id_seq', 7, true);


--
-- TOC entry 6308 (class 0 OID 0)
-- Dependencies: 267
-- Name: fault_lines_fault_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fault_lines_fault_line_id_seq', 1, true);


--
-- TOC entry 6309 (class 0 OID 0)
-- Dependencies: 271
-- Name: house_polygons_house_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.house_polygons_house_id_seq', 230, true);


--
-- TOC entry 6310 (class 0 OID 0)
-- Dependencies: 244
-- Name: incident_report_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.incident_report_evaluations_id_seq', 2, true);


--
-- TOC entry 6311 (class 0 OID 0)
-- Dependencies: 246
-- Name: incident_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.incident_reports_id_seq', 15, true);


--
-- TOC entry 6312 (class 0 OID 0)
-- Dependencies: 248
-- Name: ocr_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ocr_jobs_id_seq', 26, true);


--
-- TOC entry 6313 (class 0 OID 0)
-- Dependencies: 250
-- Name: ocr_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ocr_verifications_id_seq', 1, false);


--
-- TOC entry 6314 (class 0 OID 0)
-- Dependencies: 252
-- Name: resident_resident_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resident_resident_id_seq', 14, true);


--
-- TOC entry 6315 (class 0 OID 0)
-- Dependencies: 254
-- Name: role_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_role_id_seq', 1, true);


--
-- TOC entry 6316 (class 0 OID 0)
-- Dependencies: 257
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 42, true);


--
-- TOC entry 6317 (class 0 OID 0)
-- Dependencies: 259
-- Name: utility_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utility_applications_id_seq', 22, true);


--
-- TOC entry 6318 (class 0 OID 0)
-- Dependencies: 261
-- Name: utility_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utility_evaluations_id_seq', 12, true);


--
-- TOC entry 6319 (class 0 OID 0)
-- Dependencies: 263
-- Name: utility_ocr_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utility_ocr_results_id_seq', 1, false);


--
-- TOC entry 6320 (class 0 OID 0)
-- Dependencies: 265
-- Name: violation_report_violation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.violation_report_violation_id_seq', 1, false);


--
-- TOC entry 5978 (class 2606 OID 44394)
-- Name: archives archives_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archives
    ADD CONSTRAINT archives_pkey PRIMARY KEY (archive_id);


--
-- TOC entry 5980 (class 2606 OID 44396)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 6053 (class 2606 OID 44590)
-- Name: barangay_boundaries barangay_boundaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangay_boundaries
    ADD CONSTRAINT barangay_boundaries_pkey PRIMARY KEY (boundary_id);


--
-- TOC entry 6046 (class 2606 OID 44560)
-- Name: barangay_hazards barangay_hazards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangay_hazards
    ADD CONSTRAINT barangay_hazards_pkey PRIMARY KEY (hazard_id);


--
-- TOC entry 5982 (class 2606 OID 44402)
-- Name: business_applications business_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_applications
    ADD CONSTRAINT business_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 5987 (class 2606 OID 44404)
-- Name: business_evaluations business_evaluations_application_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_evaluations
    ADD CONSTRAINT business_evaluations_application_id_key UNIQUE (application_id);


--
-- TOC entry 5989 (class 2606 OID 44406)
-- Name: business_evaluations business_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_evaluations
    ADD CONSTRAINT business_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 5991 (class 2606 OID 44408)
-- Name: business_files business_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_files
    ADD CONSTRAINT business_files_pkey PRIMARY KEY (id);


--
-- TOC entry 5993 (class 2606 OID 44410)
-- Name: business_ocr_results business_ocr_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_ocr_results
    ADD CONSTRAINT business_ocr_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5995 (class 2606 OID 44412)
-- Name: construction_applications construction_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_applications
    ADD CONSTRAINT construction_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 5997 (class 2606 OID 44414)
-- Name: construction_evaluations construction_evaluations_application_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_evaluations
    ADD CONSTRAINT construction_evaluations_application_id_key UNIQUE (application_id);


--
-- TOC entry 5999 (class 2606 OID 44416)
-- Name: construction_evaluations construction_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_evaluations
    ADD CONSTRAINT construction_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 6001 (class 2606 OID 44418)
-- Name: construction_ocr_results construction_ocr_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_ocr_results
    ADD CONSTRAINT construction_ocr_results_pkey PRIMARY KEY (id);


--
-- TOC entry 6043 (class 2606 OID 44546)
-- Name: fault_lines fault_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fault_lines
    ADD CONSTRAINT fault_lines_pkey PRIMARY KEY (fault_line_id);


--
-- TOC entry 6049 (class 2606 OID 44574)
-- Name: house_polygons house_polygons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.house_polygons
    ADD CONSTRAINT house_polygons_pkey PRIMARY KEY (house_id);


--
-- TOC entry 6005 (class 2606 OID 44424)
-- Name: incident_report_evaluations incident_report_evaluations_application_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_report_evaluations
    ADD CONSTRAINT incident_report_evaluations_application_id_key UNIQUE (application_id);


--
-- TOC entry 6007 (class 2606 OID 44426)
-- Name: incident_report_evaluations incident_report_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_report_evaluations
    ADD CONSTRAINT incident_report_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 6010 (class 2606 OID 44428)
-- Name: incident_reports incident_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_reports
    ADD CONSTRAINT incident_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 6013 (class 2606 OID 44430)
-- Name: ocr_jobs ocr_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_jobs
    ADD CONSTRAINT ocr_jobs_pkey PRIMARY KEY (id);


--
-- TOC entry 6015 (class 2606 OID 44432)
-- Name: ocr_verifications ocr_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_verifications
    ADD CONSTRAINT ocr_verifications_pkey PRIMARY KEY (id);


--
-- TOC entry 6017 (class 2606 OID 44434)
-- Name: resident resident_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resident
    ADD CONSTRAINT resident_pkey PRIMARY KEY (resident_id);


--
-- TOC entry 6019 (class 2606 OID 44436)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (role_id);


--
-- TOC entry 6021 (class 2606 OID 44438)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- TOC entry 6023 (class 2606 OID 44440)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 6025 (class 2606 OID 44442)
-- Name: users users_supabase_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_supabase_user_id_key UNIQUE (supabase_user_id);


--
-- TOC entry 6027 (class 2606 OID 44444)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 6029 (class 2606 OID 44446)
-- Name: utility_applications utility_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_applications
    ADD CONSTRAINT utility_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 6033 (class 2606 OID 44448)
-- Name: utility_evaluations utility_evaluations_application_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_evaluations
    ADD CONSTRAINT utility_evaluations_application_id_key UNIQUE (application_id);


--
-- TOC entry 6035 (class 2606 OID 44450)
-- Name: utility_evaluations utility_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_evaluations
    ADD CONSTRAINT utility_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 6039 (class 2606 OID 44452)
-- Name: utility_ocr_results utility_ocr_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_ocr_results
    ADD CONSTRAINT utility_ocr_results_pkey PRIMARY KEY (id);


--
-- TOC entry 6041 (class 2606 OID 44454)
-- Name: violation_report violation_report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_report
    ADD CONSTRAINT violation_report_pkey PRIMARY KEY (violation_id);


--
-- TOC entry 6047 (class 1259 OID 44561)
-- Name: idx_barangay_hazards_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_barangay_hazards_geom ON public.barangay_hazards USING gist (geom);


--
-- TOC entry 5983 (class 1259 OID 44456)
-- Name: idx_business_applications_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_applications_date ON public.business_applications USING btree (application_date);


--
-- TOC entry 5984 (class 1259 OID 44457)
-- Name: idx_business_applications_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_applications_owner ON public.business_applications USING btree (first_name, last_name);


--
-- TOC entry 5985 (class 1259 OID 44458)
-- Name: idx_business_applications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_applications_status ON public.business_applications USING btree (status);


--
-- TOC entry 6002 (class 1259 OID 44459)
-- Name: idx_construction_ocr_results_app_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_construction_ocr_results_app_id ON public.construction_ocr_results USING btree (application_id);


--
-- TOC entry 6003 (class 1259 OID 44460)
-- Name: idx_construction_ocr_results_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_construction_ocr_results_created_at ON public.construction_ocr_results USING btree (created_at DESC);


--
-- TOC entry 6044 (class 1259 OID 44547)
-- Name: idx_fault_lines_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fault_lines_geom ON public.fault_lines USING gist (geom);


--
-- TOC entry 6050 (class 1259 OID 44575)
-- Name: idx_house_polygons_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_house_polygons_address ON public.house_polygons USING btree (address);


--
-- TOC entry 6051 (class 1259 OID 44576)
-- Name: idx_house_polygons_coords; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_house_polygons_coords ON public.house_polygons USING btree (center_lat, center_lng);


--
-- TOC entry 6030 (class 1259 OID 44464)
-- Name: idx_incident_report_evaluations_app_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_incident_report_evaluations_app_id ON public.utility_evaluations USING btree (application_id);


--
-- TOC entry 6008 (class 1259 OID 44465)
-- Name: idx_incident_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_incident_timestamp ON public.incident_reports USING btree (incident_timestamp);


--
-- TOC entry 6011 (class 1259 OID 44466)
-- Name: idx_ocr_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ocr_jobs_status ON public.ocr_jobs USING btree (status);


--
-- TOC entry 6031 (class 1259 OID 44467)
-- Name: idx_utility_evaluations_app_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_evaluations_app_id ON public.utility_evaluations USING btree (application_id);


--
-- TOC entry 6036 (class 1259 OID 44468)
-- Name: idx_utility_ocr_app_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_ocr_app_id ON public.utility_ocr_results USING btree (application_id);


--
-- TOC entry 6037 (class 1259 OID 44469)
-- Name: idx_utility_ocr_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_ocr_created_at ON public.utility_ocr_results USING btree (created_at DESC);


--
-- TOC entry 6055 (class 2606 OID 44470)
-- Name: business_evaluations business_evaluations_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_evaluations
    ADD CONSTRAINT business_evaluations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.business_applications(id) ON DELETE CASCADE;


--
-- TOC entry 6056 (class 2606 OID 44475)
-- Name: business_files business_files_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_files
    ADD CONSTRAINT business_files_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.business_applications(id) ON DELETE CASCADE;


--
-- TOC entry 6057 (class 2606 OID 44480)
-- Name: construction_ocr_results construction_ocr_results_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.construction_ocr_results
    ADD CONSTRAINT construction_ocr_results_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.construction_applications(id) ON DELETE CASCADE;


--
-- TOC entry 6054 (class 2606 OID 44485)
-- Name: audit_logs fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_user FOREIGN KEY (supabase_user_id) REFERENCES public.users(supabase_user_id) ON DELETE CASCADE;


--
-- TOC entry 6058 (class 2606 OID 44490)
-- Name: incident_report_evaluations incident_report_evaluations_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_report_evaluations
    ADD CONSTRAINT incident_report_evaluations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.incident_reports(id) ON DELETE CASCADE;


--
-- TOC entry 6059 (class 2606 OID 44495)
-- Name: resident resident_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resident
    ADD CONSTRAINT resident_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 6060 (class 2606 OID 44500)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(role_id);


--
-- TOC entry 6061 (class 2606 OID 44505)
-- Name: utility_evaluations utility_evaluations_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_evaluations
    ADD CONSTRAINT utility_evaluations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.utility_applications(id) ON DELETE CASCADE;


--
-- TOC entry 6062 (class 2606 OID 44510)
-- Name: utility_ocr_results utility_ocr_results_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_ocr_results
    ADD CONSTRAINT utility_ocr_results_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.utility_applications(id) ON DELETE CASCADE;


--
-- TOC entry 6063 (class 2606 OID 44515)
-- Name: violation_report violation_report_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_report
    ADD CONSTRAINT violation_report_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(user_id);


-- Completed on 2026-03-06 21:21:18

--
-- PostgreSQL database dump complete
--

\unrestrict trFxHbrIosCdM1ViYDBtzCWuJKEgtW0qURqu01B0hmWwhR9JnGsSRUffM3Xw7Wi

