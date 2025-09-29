<template>
	<view class="abc">
		<u-button>nihao</u-button>
	</view>
</template>

<script>
	export default {
		name:"demo-com",
		options: { styleIsolation: 'shared' },
		data() {
			return {
				
			};
		}
	}
</script>

<style lang="scss">
	
	.abc ::v-deep .u-button {
		color: red !important;
	}

</style>