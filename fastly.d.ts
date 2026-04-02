declare module "fastly" {
	export interface Backend {
		address: string;
		auto_loadbalance?: boolean;
		between_bytes_timeout?: number;
		client_cert?: string;
		comment?: string;
		connect_timeout?: number;
		first_byte_timeout?: number;
		healthcheck?: string;
		hostname: string;
		ipv4?: string;
		ipv6?: string;
		keepalive_time?: number;
		max_conn?: number;
		max_tls_version?: string;
		min_tls_version?: string;
		name: string;
		override_host?: string;
		port?: number;
		prefer_ipv6?: boolean;
		request_condition?: string;
		share_key?: string;
		shield?: string;
		ssl_ca_cert?: string;
		ssl_cert_hostname?: string;
		ssl_check_cert?: boolean;
		ssl_ciphers?: string;
		ssl_client_cert?: string;
		ssl_client_key?: string;
		ssl_hostname?: string;
		ssl_sni_hostname?: string;
		tcp_keepalive_enable?: boolean;
		tcp_keepalive_interval?: number;
		tcp_keepalive_probes?: number;
		tcp_keepalive_time?: number;
		use_ssl?: boolean;
		weight?: number;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id: string;
		version?: number;
		locked?: boolean;
	}

	export interface InlineResponse200 {
		status?: string;
	}

	export interface Version {
		active: boolean;
		comment?: string;
		deployed?: boolean;
		locked?: boolean;
		number: number;
		staging?: boolean;
		testing?: boolean;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id: string;
	}

	export interface ServiceVersionDetail extends Version {
		service_id?: string;
		backends?: Backend[];
		cache_settings?: any[];
		conditions?: any[];
		directors?: any[];
		domains?: DomainResponse[];
		gzips?: any[];
		headers?: any[];
		healthchecks?: any[];
		request_settings?: any[];
		response_objects?: any[];
		settings?: any;
		snippets?: Snippet[];
		vcls?: Vcl[];
		wordpress?: any[];
		environments?: any[];
	}

	export interface ServiceDetail extends Service {
		active_version?: ServiceVersionDetail | null;
		version?: ServiceVersionDetail;
		environments?: any[];
	}

	export interface Service {
		id: string;
		name: string;
		comment?: string;
		customer_id?: string;
		type: "vcl" | "wasm";
		publish_key?: string;
		paused?: boolean;
		versions: Version[];
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
	}

	export interface DomainResponse {
		name?: string;
		comment?: string;
		service_id?: string;
		version?: number;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		locked?: boolean;
	}

	export interface CreateBackendRequest {
		service_id: string;
		version_id: number;
		name: string;
		address: string;
		override_host?: string;
		port?: number;
		use_ssl?: boolean;
		ssl_cert_hostname?: string;
		ssl_sni_hostname?: string;
		auto_loadbalance?: boolean;
		between_bytes_timeout?: number;
		client_cert?: string;
		comment?: string;
		connect_timeout?: number;
		first_byte_timeout?: number;
		healthcheck?: string;
		hostname?: string;
		ipv4?: string;
		ipv6?: string;
		keepalive_time?: number;
		max_conn?: number;
		max_tls_version?: string;
		min_tls_version?: string;
		prefer_ipv6?: boolean;
		request_condition?: string;
		share_key?: string;
		shield?: string;
		ssl_ca_cert?: string;
		ssl_check_cert?: boolean;
		ssl_ciphers?: string;
		ssl_client_cert?: string;
		ssl_client_key?: string;
		ssl_hostname?: string;
		tcp_keepalive_enable?: boolean;
		tcp_keepalive_interval?: number;
		tcp_keepalive_probes?: number;
		tcp_keepalive_time?: number;
		weight?: number;
	}

	export type SnippetType =
		| "init"
		| "recv"
		| "hash"
		| "hit"
		| "miss"
		| "pass"
		| "fetch"
		| "error"
		| "deliver"
		| "log"
		| "none";

	export interface Snippet {
		name: string;
		type: SnippetType;
		content: string;
		priority?: string;
		dynamic?: "0" | "1";
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id: string;
		version?: string;
		id: string;
	}

	export interface Vcl {
		name: string;
		content?: string;
		main?: boolean;
		service_id?: string;
		version?: number;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
	}

	export interface DictionaryResponse {
		name?: string;
		write_only?: boolean;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id?: string;
		version?: number;
		id?: string;
	}

	export interface DictionaryItemResponse {
		item_key?: string;
		item_value?: string;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		dictionary_id?: string;
		service_id?: string;
	}

	export interface BulkUpdateDictionaryItem {
		item_key?: string;
		item_value?: string;
		op?: "create" | "update" | "delete" | "upsert";
	}

	export interface BulkUpdateDictionaryListRequest {
		items?: BulkUpdateDictionaryItem[];
	}

	export interface ValidatorResult {
		status?: string;
		errors?: any[];
		warnings?: any[];
	}

	export class BackendApi {
		createBackend(options: CreateBackendRequest): Promise<Backend>;
		listBackends(options: {
			service_id: string;
			version_id: number;
		}): Promise<Backend[]>;
		deleteBackend(options: {
			service_id: string;
			version_id: number;
			backend_name: string;
		}): Promise<InlineResponse200>;
	}

	export class ServiceApi {
		createService(options?: {
			comment?: string;
			name?: string;
			customer_id?: string;
			type?: "vcl" | "wasm";
		}): Promise<Service>;
		deleteService(options: { service_id: string }): Promise<InlineResponse200>;
		getService(options: { service_id: string }): Promise<Service>;
		getServiceDetail(options: {
			service_id: string;
			version?: number;
			filter_versions_active?: boolean;
		}): Promise<ServiceDetail>;
		listServiceDomains(options: { service_id: string }): Promise<any[]>;
		listServices(options?: {
			page?: number;
			per_page?: number;
			sort?: string;
			direction?: "ascend" | "descend";
		}): Promise<Service[]>;
		searchService(options: { name: string }): Promise<Service>;
		updateService(options: {
			service_id: string;
			comment?: string;
			name?: string;
			customer_id?: string;
		}): Promise<Service>;
	}

	export class DomainApi {
		checkDomain(options: {
			service_id: string;
			version_id: number;
			domain_name: string;
		}): Promise<[DomainResponse, string, boolean][]>;
		checkDomains(options: {
			service_id: string;
			version_id: number;
		}): Promise<[DomainResponse, string, boolean][]>;
		createDomain(options: {
			service_id: string;
			version_id: number;
			comment?: string;
			name?: string;
		}): Promise<DomainResponse>;
		deleteDomain(options: {
			service_id: string;
			version_id: number;
			domain_name: string;
		}): Promise<InlineResponse200>;
		getDomain(options: {
			service_id: string;
			version_id: number;
			domain_name: string;
		}): Promise<DomainResponse>;
		listDomains(options: {
			service_id: string;
			version_id: number;
		}): Promise<DomainResponse[]>;
		updateDomain(options: {
			service_id: string;
			version_id: number;
			domain_name: string;
			comment?: string;
			name?: string;
		}): Promise<DomainResponse>;
	}

	export class SnippetApi {
		createSnippet(options: {
			service_id: string;
			version_id: number;
			name?: string;
			type?:
				| "init"
				| "recv"
				| "hash"
				| "hit"
				| "miss"
				| "pass"
				| "fetch"
				| "error"
				| "deliver"
				| "log"
				| "none";
			content?: string;
			priority?: string;
			dynamic: "0" | "1";
		}): Promise<Snippet>;
		deleteSnippet(options: {
			service_id: string;
			version_id: number;
			name: string;
		}): Promise<InlineResponse200>;
		getSnippet(options: {
			service_id: string;
			version_id: number;
			name: string;
		}): Promise<Snippet>;
		getSnippetDynamic(options: {
			service_id: string;
			id: string;
		}): Promise<Snippet>;
		listSnippets(options: {
			service_id: string;
			version_id: number;
		}): Promise<Snippet[]>;
		updateSnippet(options: {
			service_id: string;
			version_id: number;
			name: string;
			type?:
				| "init"
				| "recv"
				| "hash"
				| "hit"
				| "miss"
				| "pass"
				| "fetch"
				| "error"
				| "deliver"
				| "log"
				| "none";
			content?: string;
			priority?: string;
			dynamic?: "0" | "1";
		}): Promise<Snippet>;
		updateSnippetDynamic(options: {
			service_id: string;
			id: string;
			name?: string;
			type?:
				| "init"
				| "recv"
				| "hash"
				| "hit"
				| "miss"
				| "pass"
				| "fetch"
				| "error"
				| "deliver"
				| "log"
				| "none";
			content?: string;
			priority?: string;
			dynamic?: "0" | "1";
		}): Promise<Snippet>;
	}

	export class VersionApi {
		activateServiceVersion(options: {
			service_id: string;
			version_id: number;
		}): Promise<Version>;
		cloneServiceVersion(options: {
			service_id: string;
			version_id: number;
		}): Promise<Version>;
	}

	export class VclApi {
		createCustomVcl(options: {
			service_id: string;
			version_id: number;
			content?: string;
			main?: boolean;
			name?: string;
		}): Promise<Vcl>;
		deleteCustomVcl(options: {
			service_id: string;
			version_id: number;
			vcl_name: string;
		}): Promise<InlineResponse200>;
		getCustomVcl(options: {
			service_id: string;
			version_id: number;
			vcl_name: string;
			no_content?: string;
		}): Promise<Vcl>;
		getCustomVclBoilerplate(options: {
			service_id: string;
			version_id: number;
		}): Promise<string>;
		getCustomVclGenerated(options: {
			service_id: string;
			version_id: number;
		}): Promise<Vcl>;
		getCustomVclGeneratedHighlighted(options: {
			service_id: string;
			version_id: number;
		}): Promise<any>;
		getCustomVclHighlighted(options: {
			service_id: string;
			version_id: number;
			vcl_name: string;
		}): Promise<any>;
		getCustomVclRaw(options: {
			service_id: string;
			version_id: number;
			vcl_name: string;
		}): Promise<string>;
		lintVclDefault(options: {
			inline_object1: { vcl: string };
		}): Promise<ValidatorResult>;
		lintVclForService(options: {
			service_id: string;
			inline_object: { vcl: string };
		}): Promise<ValidatorResult>;
		listCustomVcl(options: {
			service_id: string;
			version_id: number;
		}): Promise<Vcl[]>;
		setCustomVclMain(options: {
			service_id: string;
			version_id: number;
			vcl_name: string;
		}): Promise<Vcl>;
		updateCustomVcl(options: {
			service_id: string;
			version_id: number;
			vcl_name: string;
			content?: string;
			main?: boolean;
			name?: string;
		}): Promise<Vcl>;
	}

	export class DictionaryApi {
		createDictionary(options: {
			service_id: string;
			version_id: number;
			name?: string;
			write_only?: boolean;
		}): Promise<DictionaryResponse>;
		deleteDictionary(options: {
			service_id: string;
			version_id: number;
			dictionary_name: string;
		}): Promise<InlineResponse200>;
		getDictionary(options: {
			service_id: string;
			version_id: number;
			dictionary_name: string;
		}): Promise<DictionaryResponse>;
		listDictionaries(options: {
			service_id: string;
			version_id: number;
		}): Promise<DictionaryResponse[]>;
		updateDictionary(options: {
			service_id: string;
			version_id: number;
			dictionary_name: string;
			name?: string;
			write_only?: boolean;
		}): Promise<DictionaryResponse>;
	}

	export class DictionaryItemApi {
		bulkUpdateDictionaryItem(options: {
			service_id: string;
			dictionary_id: string;
			bulk_update_dictionary_list_request?: BulkUpdateDictionaryListRequest;
		}): Promise<InlineResponse200>;
		listDictionaryItems(options: {
			service_id: string;
			dictionary_id: string;
			page?: number;
			per_page?: number;
			sort?: string;
			direction?: "ascend" | "descend";
		}): Promise<DictionaryItemResponse[]>;
	}

	export interface ConfigStore {
		name?: string;
	}

	export interface ConfigStoreResponse {
		created_at: string;
		deleted_at: string;
		updated_at: string;
		name: string;
		id: string;
	}

	export interface ConfigStoreItem {
		item_key: string;
		item_value: string;
	}

	export interface ConfigStoreItemResponse {
		item_key: string;
		item_value: string;
		created_at: string;
		deleted_at: string;
		updated_at: string;
		store_id: string;
	}

	export interface ConfigStoreInfoResponse {
		item_count?: number;
	}

	export interface BulkUpdateConfigStoreItem {
		item_key?: string;
		item_value?: string;
		op?: "create" | "update" | "delete" | "upsert";
	}

	export interface BulkUpdateConfigStoreListRequest {
		items?: BulkUpdateConfigStoreItem[];
	}

	export class ConfigStoreApi {
		createConfigStore(options?: {
			name?: string;
		}): Promise<ConfigStoreResponse>;
		deleteConfigStore(options: {
			config_store_id: string;
		}): Promise<InlineResponse200>;
		getConfigStore(options: {
			config_store_id: string;
		}): Promise<ConfigStoreResponse>;
		getConfigStoreInfo(options: {
			config_store_id: string;
		}): Promise<ConfigStoreInfoResponse>;
		listConfigStoreServices(options: {
			config_store_id: string;
		}): Promise<any[]>;
		listConfigStores(): Promise<ConfigStoreResponse[]>;
		updateConfigStore(options: {
			config_store_id: string;
			name?: string;
		}): Promise<ConfigStoreResponse>;
	}

	export class ConfigStoreItemApi {
		bulkUpdateConfigStoreItem(options: {
			config_store_id: string;
			bulk_update_config_store_list_request?: BulkUpdateConfigStoreListRequest;
		}): Promise<InlineResponse200>;
		createConfigStoreItem(options: {
			config_store_id: string;
			item_key?: string;
			item_value?: string;
		}): Promise<ConfigStoreItemResponse>;
		deleteConfigStoreItem(options: {
			config_store_id: string;
			config_store_item_key: string;
		}): Promise<InlineResponse200>;
		getConfigStoreItem(options: {
			config_store_id: string;
			config_store_item_key: string;
		}): Promise<ConfigStoreItemResponse>;
		listConfigStoreItems(options: {
			config_store_id: string;
		}): Promise<ConfigStoreItemResponse[]>;
		updateConfigStoreItem(options: {
			config_store_id: string;
			config_store_item_key: string;
			item_key?: string;
			item_value?: string;
		}): Promise<ConfigStoreItemResponse>;
		upsertConfigStoreItem(options: {
			config_store_id: string;
			config_store_item_key: string;
			item_key?: string;
			item_value?: string;
		}): Promise<ConfigStoreItemResponse>;
	}

	export type DdosProtectionMode = "log" | "block";

	export interface DdosProtectionRequestUpdateConfiguration {
		mode?: DdosProtectionMode;
	}

	export interface DdosProtectionResponseEnable {
		service_id?: string;
		enabled?: boolean;
	}

	export interface DdosProtectionResponseConfigure {
		service_id?: string;
		mode?: DdosProtectionMode;
	}

	export interface DdosProtectionResponseBodyGetAllServices {
		services?: string[];
	}

	export class ProductDdosProtectionApi {
		disableProductDdosProtection(options: {
			service_id: string;
		}): Promise<void>;
		enableProductDdosProtection(options: {
			service_id: string;
		}): Promise<DdosProtectionResponseEnable>;
		getProductDdosProtection(options: {
			service_id: string;
		}): Promise<DdosProtectionResponseEnable>;
		getProductDdosProtectionConfiguration(options: {
			service_id: string;
		}): Promise<DdosProtectionResponseConfigure>;
		getServicesProductDdosProtection(): Promise<DdosProtectionResponseBodyGetAllServices>;
		setProductDdosProtectionConfiguration(options: {
			service_id: string;
			ddos_protection_request_update_configuration?: DdosProtectionRequestUpdateConfiguration;
		}): Promise<DdosProtectionResponseConfigure>;
	}

	export interface LoggingHttpResponse {
		name?: string;
		placement?: string;
		response_condition?: string;
		format?: string;
		log_processing_region?: string;
		format_version?: string;
		url?: string;
		content_type?: string;
		header_name?: string;
		header_value?: string;
		method?: string;
		json_format?: string;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id?: string;
		version?: string;
	}

	export interface LoggingHttpsResponse {
		name?: string;
		placement?: string;
		response_condition?: string;
		format?: string;
		log_processing_region?: string;
		format_version?: string;
		tls_ca_cert?: string;
		tls_client_cert?: string;
		tls_client_key?: string;
		tls_hostname?: string;
		request_max_entries?: number;
		request_max_bytes?: number;
		url?: string;
		content_type?: string;
		header_name?: string;
		header_value?: string;
		method?: string;
		json_format?: string;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id?: string;
		version?: string;
	}

	export interface LoggingS3Response {
		name?: string;
		placement?: string;
		response_condition?: string;
		format?: string;
		log_processing_region?: string;
		format_version?: string;
		message_type?: string;
		timestamp_format?: string;
		compression_codec?: string;
		period?: string;
		gzip_level?: string;
		access_key?: string;
		acl?: string;
		bucket_name?: string;
		domain?: string;
		iam_role?: string;
		path?: string;
		public_key?: string;
		redundancy?: string;
		secret_key?: string;
		server_side_encryption_kms_key_id?: string;
		server_side_encryption?: string;
		file_max_bytes?: number;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id?: string;
		version?: string;
	}

	export interface LoggingSplunkResponse {
		name?: string;
		placement?: string;
		response_condition?: string;
		format?: string;
		log_processing_region?: string;
		format_version?: string;
		tls_ca_cert?: string;
		tls_client_cert?: string;
		tls_client_key?: string;
		tls_hostname?: string;
		request_max_entries?: number;
		request_max_bytes?: number;
		url?: string;
		token?: string;
		use_tls?: string;
		created_at?: string;
		deleted_at?: string;
		updated_at?: string;
		service_id?: string;
		version?: string;
	}

	export class LoggingHttpApi {
		listLogHttp(options: {
			service_id: string;
			version_id: number;
		}): Promise<LoggingHttpResponse[]>;
		createLogHttp(options: {
			service_id: string;
			version_id: number;
			[key: string]: any;
		}): Promise<LoggingHttpResponse>;
		deleteLogHttp(options: {
			service_id: string;
			version_id: number;
			logging_http_name: string;
		}): Promise<InlineResponse200>;
		getLogHttp(options: {
			service_id: string;
			version_id: number;
			logging_http_name: string;
		}): Promise<LoggingHttpResponse>;
		updateLogHttp(options: {
			service_id: string;
			version_id: number;
			logging_http_name: string;
			[key: string]: any;
		}): Promise<LoggingHttpResponse>;
	}

	export class LoggingHttpsApi {
		listLogHttps(options: {
			service_id: string;
			version_id: number;
		}): Promise<LoggingHttpsResponse[]>;
		createLogHttps(options: {
			service_id: string;
			version_id: number;
			[key: string]: any;
		}): Promise<LoggingHttpsResponse>;
		deleteLogHttps(options: {
			service_id: string;
			version_id: number;
			logging_https_name: string;
		}): Promise<InlineResponse200>;
		getLogHttps(options: {
			service_id: string;
			version_id: number;
			logging_https_name: string;
		}): Promise<LoggingHttpsResponse>;
		updateLogHttps(options: {
			service_id: string;
			version_id: number;
			logging_https_name: string;
			[key: string]: any;
		}): Promise<LoggingHttpsResponse>;
	}

	export class LoggingS3Api {
		listLogAwsS3(options: {
			service_id: string;
			version_id: number;
		}): Promise<LoggingS3Response[]>;
		createLogAwsS3(options: {
			service_id: string;
			version_id: number;
			[key: string]: any;
		}): Promise<LoggingS3Response>;
		deleteLogAwsS3(options: {
			service_id: string;
			version_id: number;
			logging_s3_name: string;
		}): Promise<InlineResponse200>;
		getLogAwsS3(options: {
			service_id: string;
			version_id: number;
			logging_s3_name: string;
		}): Promise<LoggingS3Response>;
		updateLogAwsS3(options: {
			service_id: string;
			version_id: number;
			logging_s3_name: string;
			[key: string]: any;
		}): Promise<LoggingS3Response>;
	}

	export class LoggingSplunkApi {
		listLogSplunk(options: {
			service_id: string;
			version_id: number;
		}): Promise<LoggingSplunkResponse[]>;
		createLogSplunk(options: {
			service_id: string;
			version_id: number;
			[key: string]: any;
		}): Promise<LoggingSplunkResponse>;
		deleteLogSplunk(options: {
			service_id: string;
			version_id: number;
			logging_splunk_name: string;
		}): Promise<InlineResponse200>;
		getLogSplunk(options: {
			service_id: string;
			version_id: number;
			logging_splunk_name: string;
		}): Promise<LoggingSplunkResponse>;
		updateLogSplunk(options: {
			service_id: string;
			version_id: number;
			logging_splunk_name: string;
			[key: string]: any;
		}): Promise<LoggingSplunkResponse>;
	}
}
